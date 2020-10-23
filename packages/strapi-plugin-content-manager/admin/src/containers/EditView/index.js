import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { useHistory } from 'react-router-dom';
import {
  BackHeader,
  LiLink,
  LoadingIndicatorPage,
  CheckPermissions,
  useUserPermissions,
} from 'strapi-helper-plugin';
import { Padded } from '@buffetjs/core';

import pluginId from '../../pluginId';
import pluginPermissions from '../../permissions';
import { generatePermissionsObject } from '../../utils';
import Container from '../../components/Container';
import DynamicZone from '../../components/DynamicZone';
import FormWrapper from '../../components/FormWrapper';
import FieldComponent from '../../components/FieldComponent';
import Inputs from '../../components/Inputs';
import SelectWrapper from '../../components/SelectWrapper';
import useFetchContentTypeLayout from '../../hooks/useFetchContentTypeLayout';
import getInjectedComponents from '../../utils/getComponents';
import EditViewDataManagerProvider from '../EditViewDataManagerProvider';
import EditViewProvider from '../EditViewProvider';
import Header from './Header';
import { createAttributesLayout } from './utils';
import { LinkWrapper, SubWrapper } from './components';
import DeleteLink from './DeleteLink';
import InformationCard from './InformationCard';

/* eslint-disable  react/no-array-index-key */

const EditView = ({ components, currentEnvironment, models, plugins, slug }) => {
  const { isLoading, layout } = useFetchContentTypeLayout(slug);
  const { goBack } = useHistory();
  // Permissions
  const viewPermissions = useMemo(() => generatePermissionsObject(slug), [slug]);
  const { allowedActions } = useUserPermissions(viewPermissions);

  const currentContentTypeLayoutData = useMemo(() => get(layout, ['contentType'], {}), [layout]);

  // Check if a block is a dynamic zone
  const isDynamicZone = useCallback(block => {
    return block.every(subBlock => {
      return subBlock.every(obj => obj.fieldSchema.type === 'dynamiczone');
    });
  }, []);

  const formattedContentTypeLayout = useMemo(() => {
    if (!currentContentTypeLayoutData.layouts) {
      return [];
    }

    return createAttributesLayout(
      currentContentTypeLayoutData.layouts.edit,
      currentContentTypeLayoutData.schema.attributes
    );
  }, [currentContentTypeLayoutData]);

  if (isLoading) {
    return <LoadingIndicatorPage />;
  }

  return (
    <EditViewProvider
      allowedActions={allowedActions}
      allLayoutData={layout}
      components={components}
      isSingleType={false}
      layout={currentContentTypeLayoutData}
      models={models}
    >
      <EditViewDataManagerProvider
        allLayoutData={layout}
        redirectToPreviousPage={goBack}
        isSingleType={false}
        slug={slug}
      >
        <BackHeader onClick={goBack} />
        <Container className="container-fluid">
          <Header />
          <div className="row" style={{ paddingTop: 3 }}>
            <div className="col-md-12 col-lg-9" style={{ marginBottom: 13 }}>
              {formattedContentTypeLayout.map((block, blockIndex) => {
                if (isDynamicZone(block)) {
                  const {
                    0: {
                      0: { name, fieldSchema },
                    },
                  } = block;

                  return (
                    <DynamicZone
                      key={blockIndex}
                      name={name}
                      max={fieldSchema.max}
                      min={fieldSchema.min}
                    />
                  );
                }

                return (
                  <FormWrapper key={blockIndex}>
                    {block.map((fieldsBlock, fieldsBlockIndex) => {
                      return (
                        <div className="row" key={fieldsBlockIndex}>
                          {fieldsBlock.map(
                            ({ name, size, fieldSchema, metadatas: { label } }, fieldIndex) => {
                              const isComponent = fieldSchema.type === 'component';

                              if (isComponent) {
                                const { component, max, min, repeatable = false } = fieldSchema;
                                const componentUid = fieldSchema.component;

                                return (
                                  <FieldComponent
                                    key={componentUid}
                                    componentUid={component}
                                    isRepeatable={repeatable}
                                    label={label}
                                    max={max}
                                    min={min}
                                    name={name}
                                  />
                                );
                              }

                              return (
                                <div className={`col-${size}`} key={name}>
                                  <Inputs
                                    autoFocus={
                                      blockIndex === 0 && fieldsBlockIndex === 0 && fieldIndex === 0
                                    }
                                    keys={name}
                                    layout={currentContentTypeLayoutData}
                                    name={name}
                                  />
                                </div>
                              );
                            }
                          )}
                        </div>
                      );
                    })}
                  </FormWrapper>
                );
              })}
            </div>
            <div className="col-md-12 col-lg-3">
              <InformationCard />
              <Padded size="smd" top />
              {currentContentTypeLayoutData.layouts.editRelations.length > 0 && (
                <SubWrapper style={{ padding: '0 20px 1px', marginBottom: '25px' }}>
                  <div style={{ paddingTop: '22px' }}>
                    {currentContentTypeLayoutData.layouts.editRelations.map(relationName => {
                      const relation = get(
                        currentContentTypeLayoutData,
                        ['schema', 'attributes', relationName],
                        {}
                      );
                      const relationMetas = get(
                        currentContentTypeLayoutData,
                        ['metadatas', relationName, 'edit'],
                        {}
                      );

                      return (
                        <SelectWrapper
                          {...relation}
                          {...relationMetas}
                          key={relationName}
                          name={relationName}
                          relationsType={relation.relationType}
                        />
                      );
                    })}
                  </div>
                </SubWrapper>
              )}
              <LinkWrapper>
                <ul>
                  <CheckPermissions permissions={pluginPermissions.collectionTypesConfigurations}>
                    <LiLink
                      message={{
                        id: 'app.links.configure-view',
                      }}
                      icon="layout"
                      key={`${pluginId}.link`}
                      url="ctm-configurations/edit-settings/content-types"
                      onClick={() => {
                        // emitEvent('willEditContentTypeLayoutFromEditView');
                      }}
                    />
                  </CheckPermissions>
                  {getInjectedComponents(
                    'editView',
                    'right.links',
                    plugins,
                    currentEnvironment,
                    slug
                  )}
                  {allowedActions.canDelete && <DeleteLink />}
                </ul>
              </LinkWrapper>
            </div>
          </div>
        </Container>
      </EditViewDataManagerProvider>
    </EditViewProvider>
  );
};

EditView.defaultProps = {
  currentEnvironment: 'production',
  emitEvent: () => {},
  plugins: {},
};

EditView.propTypes = {
  components: PropTypes.array.isRequired,
  currentEnvironment: PropTypes.string,
  deleteLayout: PropTypes.func.isRequired,
  emitEvent: PropTypes.func,
  layouts: PropTypes.object.isRequired,
  models: PropTypes.array.isRequired,
  plugins: PropTypes.object,
  slug: PropTypes.string.isRequired,
};

export { EditView };
export default memo(EditView);
