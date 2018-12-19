import React from 'react';

const MapDefsMarkers = ({}) => (
  <defs>
    <marker id="arrow" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,3v-3l6,3l-6,3z" style="fill: red;"></path>
    </marker>
    <marker id="arrow-off" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,3v-3l6,3l-6,3z" style="fill: black; fill-opacity: 0.2;"></path>
    </marker>      
  </defs>
);

export default MapDefsMarkers;