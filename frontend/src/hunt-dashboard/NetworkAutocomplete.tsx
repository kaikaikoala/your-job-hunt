import { forwardRef, useImperativeHandle, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchContacts, createContact, type NetworkContact } from '../api/network';

export interface NetworkAutocompleteHandle {
  resolveReferrerId: () => Promise<string | undefined>;
  reset: () => void;
}

interface Props {
  enabled?: boolean;
  label?: string;
}

const NetworkAutocomplete = forwardRef<NetworkAutocompleteHandle, Props>(
  ({ enabled = true, label = 'Referred by (optional)' }, ref) => {
    const qc = useQueryClient();
    const [referrerValue, setReferrerValue] = useState<NetworkContact | string | null>(null);
    const [referrerInput, setReferrerInput] = useState('');

    const { data: contacts } = useQuery({
      queryKey: ['network'],
      queryFn: fetchContacts,
      enabled,
    });

    useImperativeHandle(ref, () => ({
      async resolveReferrerId() {
        if (referrerValue && typeof referrerValue === 'object') {
          return referrerValue.referrerId;
        }
        const newName = (typeof referrerValue === 'string' ? referrerValue : referrerInput).trim();
        if (newName) {
          const newContact = await createContact({ name: newName });
          qc.invalidateQueries({ queryKey: ['network'] });
          return newContact.referrerId;
        }
        return undefined;
      },
      reset() {
        setReferrerValue(null);
        setReferrerInput('');
      },
    }));

    return (
      <Autocomplete
        freeSolo
        options={contacts ?? []}
        getOptionLabel={(option) =>
          typeof option === 'string'
            ? option
            : `${option.name}${option.type ? ` (${option.type})` : ''}`
        }
        value={referrerValue}
        onChange={(_, newValue) => setReferrerValue(newValue)}
        inputValue={referrerInput}
        onInputChange={(_, newInput) => setReferrerInput(newInput)}
        renderInput={(params) => (
          <TextField {...params} label={label} />
        )}
      />
    );
  },
);

export default NetworkAutocomplete;
