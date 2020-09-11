import React, { useState } from 'react';
import { connect, ConnectedProps  } from 'react-redux';
import axios from 'axios';
import { Classes, Checkbox, RadioGroup, Radio, HTMLSelect } from "@blueprintjs/core";

import { setExpressionDatasetFilterValue } from '../store/expression-dataset/actions'
import { CombinedState } from '../store';
import './FilterPanel.scss';
import { CellsMetaMetadata, CellActivity } from '../core/types';
import { updateDataset } from '../store/datasets/actions';
import { loadProto } from '../util/proto';
import { DataMode } from '../App';

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
  mode : DataMode;
  setMode : (mode : DataMode) => void;
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
  mode,
  setMode,
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
    } else {
      updateDataset?.('goActivity', []);
    }
  };

  return (
    <div className="filter-panel">
      <div className="project-description">
        <h3>Visual exploration of the <a href="https://github.com/czbiohub/tabula-muris-senis">Tabula Muris Senis</a> dataset</h3>
        <p>Detailed project description and the data preparation code can be found <a href="https://github.com/justgos/indagatio-muris-senis">here</a></p>
        <div className="mode-label">View mode</div>
        <HTMLSelect
          value={mode}
          options={[
            { label: 'Pathways', value: 'pathways' },
            { label: 'Embedding', value: 'embeddings' },
          ]}
          onChange={evt => setMode(evt.target.value as DataMode)}
          className="bp3-fill mode-select"
        />
        {mode === 'pathways' &&
        <>
          <p>Fold-changes in expression of various genes overlaid over the reaction network, vertically aligned by the cellular location: nucleus -&gt; extracellular region</p>
        </>
        }
        {mode === 'embeddings' &&
        <>
          <p>UMAP embedding of cells by their gene expression, soft-filterable by the cellular processes which the most-expressed genes are associated with</p>
        </>
        }
      </div>
      {mode === 'pathways' &&
      <>
        <input 
          className={`filter-element text-filter ${Classes.INPUT} ${Classes.MINIMAL}`} 
          type="text" 
          placeholder="filter by any text field" 
          value={filterValues.get("text") as string || ''} 
          onChange={ evt => setFilterValue("text", evt.currentTarget.value) } 
        />
        <Checkbox 
          className={`filter-element homolog-filter ${Classes.MINIMAL}`} 
          checked={filterValues.get("uniprot_daphnia") != null} 
          onChange={ evt => setFilterValue("uniprot_daphnia", evt.currentTarget.checked ? "~" : undefined) }
        >
          has Daphnia homolog
        </Checkbox>
      </>
      }
      {mode === 'embeddings' && cellMetaMetadata &&
        <div className="filter-element">
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
        </div>
      }
      {mode === 'pathways' &&
        [ 'start_age', 'end_age', 'sex', 'tissue', 'subtissue', 'cell_ontology_class' ].map(filter_param => 
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
        )
      }
    </div>
  );
};

export default connector(FilterPanel);
