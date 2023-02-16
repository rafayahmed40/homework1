import React, {useState, useEffect} from 'react';

export let isLoggedIn = false;
export const setIsLoggedIn = (value: boolean) => {
  isLoggedIn = value;
};