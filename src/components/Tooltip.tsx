import React from 'react';

import './Tooltip.scss';

type Props = {
  active : boolean;
  x : number;
  y : number;
  content : JSX.Element;
};

function Tooltip({ active, x, y, content } : Props) {
  return (
    <div className="tooltip" style={{ left: x, top: y, display: active ? 'block' : 'none' }}>
      {content}
    </div>
  );
};

export default Tooltip;
