import React, { useState } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import axios from 'axios';
import { Classes, Checkbox, RadioGroup, Radio } from "@blueprintjs/core";

import { setExpressionDatasetFilterValue } from '../store/expression-dataset/actions'
import { CombinedState } from '../store';
import './FilterPanel.scss';
import { CellsMetaMetadata, CellActivity } from '../core/types';
import { updateDataset } from '../store/datasets/actions';
import { loadProto } from '../util/proto';

const mapStateToProps = (
  state : CombinedState
) => {
  return {
    filterValues: state.expressionDataset.filterValues,
    filterValueVocabulary: state.expressionDataset.filterValueVocabulary,
    cellMetaMetadata: state.datasets['cellMetadata']?.meta as CellsMetaMetadata,
  };
};

const mapDispatchToProps = {
  setFilterValue: setExpressionDatasetFilterValue,
  updateDataset: updateDataset,
};

const connector = connect(
  mapStateToProps,
  mapDispatchToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & {
  //
};

const dimensionLabels : { [dimension : string] : string } = {
  'start_age': 'Start age',
  'end_age': 'End age',
  'sex': 'Sex',
  'tissue': 'Tissue',
  'subtissue': 'Subtissue',
  'cell_ontology_class': 'Cell type',
};

function FilterPanel({
  filterValues, 
  filterValueVocabulary, 
  cellMetaMetadata, 
  setFilterValue,
  updateDataset,
} : Props) {
  const [ goActivity, setGOActivity ] = useState(-1);
  const changeGOActivity = async (id : number) => {
    setGOActivity(id);
    if(id >= 0) {
      const goActivity = await loadProto<CellActivity>('Activity', './data/go-activity/' + id + '.bin');
      updateDataset?.('goActivity', goActivity.values);
      console.log('goActivity.values', goActivity.values)
    } else {
      updateDataset?.('goActivity', []);
    }
  };

  return (
    <div className="filter-panel">
      {/* <input 
        className={`filter-element text-filter ${Classes.INPUT} ${Classes.MINIMAL}`} 
        type="text" 
        placeholder="filter by any text field" 
        value={filterValues.get("text") as string || ''} 
        onChange={ evt => setFilterValue("text", evt.currentTarget.value) } 
      /> */}
      <Checkbox 
        className={`filter-element homolog-filter ${Classes.MINIMAL}`} 
        checked={filterValues.get("uniprot_daphnia") != null} 
        onChange={ evt => setFilterValue("uniprot_daphnia", evt.currentTarget.checked ? "~" : undefined) }
      >
        has Daphnia homolog
      </Checkbox>
      {cellMetaMetadata && <div className="filter-element">
        <div className="filter-element-label">
          GO activities
        </div>
        <RadioGroup 
          className={`${Classes.MINIMAL}`}
          selectedValue={goActivity} 
          onChange={ evt => changeGOActivity(parseInt(evt.currentTarget.value)) } 
        >
        <Radio value={-1}>&lt;none&gt;</Radio>
        {cellMetaMetadata.goActivities.map((ga, i) => 
          <Radio key={i} value={i}>
            {ga}
          </Radio>
        )}
        </RadioGroup>
      </div>}
      {[ 'start_age', 'end_age', 'sex', 'tissue', 'subtissue', 'cell_ontology_class' ].map(filter_param => 
        <div key={filter_param} className="filter-element">
          <div className="filter-element-label">
            {dimensionLabels[filter_param]}
          </div>
          <RadioGroup 
            className={`${Classes.MINIMAL}`}
            selectedValue={filterValues.get(filter_param) as string} 
            onChange={ evt => setFilterValue(filter_param, evt.currentTarget.value) } 
          >
          {[...(filterValueVocabulary.get(filter_param)?.entries() || [])].map(t => 
            <Radio key={t[0]} value={t[0]}>
              {t[0] !== '' ? t[0] : '<none>'}
              <span className="count">{t[1]}</span>
            </Radio>
          )}
          </RadioGroup>
        </div>
      )}
    </div>
  );
};

export default connector(FilterPanel);
