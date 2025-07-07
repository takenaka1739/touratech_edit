import { useParams } from 'react-router-dom';
import toNumber from 'lodash/toNumber';

export const useIdFromParams: () => number | undefined = () => {
  const { id } = useParams<{ id: string }>();
  return id ? toNumber(id) : undefined;
};
