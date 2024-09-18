import { createContext, useContext, useState, ReactNode } from 'react';

type DnDType = string | null;
type DnDContextType = [DnDType, React.Dispatch<React.SetStateAction<DnDType>>];

const DnDContext = createContext<DnDContextType>([null, () => {}]);

interface DnDProviderProps {
  children: ReactNode;
}

export const DnDProvider = ({ children }: DnDProviderProps) => {
  const [type, setType] = useState<DnDType>(null);

  return (
    <DnDContext.Provider value={[type, setType]}>
      {children}
    </DnDContext.Provider>
  );
}

export default DnDContext;

export const useDnD = (): DnDContextType => {
  return useContext(DnDContext);
}