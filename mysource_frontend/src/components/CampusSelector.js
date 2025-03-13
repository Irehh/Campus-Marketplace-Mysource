// src/components/CampusSelector.js
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Select from 'react-select';
import { CAMPUSES } from '../config';

const CampusSelector = ({ onChange }) => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="text-sm text-secondary-600">
        Campus: {CAMPUSES.find(c => c.value === user.campus)?.label || user.campus}
      </div>
    );
  }

  return (
    <Select
      options={CAMPUSES}
      onChange={(selectedOption) => onChange(selectedOption.value)}
      placeholder="Select Campus"
      className="w-48"
      classNamePrefix="react-select"
    />
  );
};

export default CampusSelector;