import React from 'react';
import styled from 'styled-components';

type FormLabelSelectorProps = {
  selected: number[] | undefined;
  onSelected: (no: number) => void;
};

export const FormLabelSelector: React.VFC<FormLabelSelectorProps> = ({ selected, onSelected }) => {
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const no = Number(e.currentTarget.dataset.no);
    onSelected(no);
  };

  const labels = [];
  for (let i = 1; i <= 24; i++) {
    labels.push(
      <div key={i} className="w-1/3 p-1">
        <Button isSelected={selected?.includes(i) ?? false} onClick={onClick} data-no={i} />
      </div>
    );
  }

  return (
    <div className="max-w-10 ">
      <div className="flex flex-wrap border border-gray-300 p-1">{labels}</div>
    </div>
  );
};

const Button = styled.button<{ isSelected: boolean }>`
  display: block;
  background-color: ${({ isSelected }) => (isSelected ? '#f9dc06' : '#fff')};
  border: 1px solid #f9dc06;
  width: 100%;
  height: 20px;
  transition: all 0.3s ease;
  appearance: none;

  :hover {
    cursor: pointer;
    background-color: ${({ isSelected }) => (isSelected ? '#f9dc06' : '#edf2f7')};
    outline: none;
  }

  :focus {
    outline: none;
  }
`;
