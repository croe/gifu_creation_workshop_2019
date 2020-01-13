import React from 'react';

const RootContext = React.createContext({});

export const Provider = RootContext.Provider;
export const Consumer = RootContext.Provider;
export default RootContext;