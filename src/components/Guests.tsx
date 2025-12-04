import React from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { GuestSearch } from './GuestSearch';

interface GuestData {
  guest: string;
  guest_instrument?: string;
  guest_id?: number;
}

interface TableState {
  data: GuestData[];
  loading: boolean;
  currentPage: number;
  totalCount: number;
}

export function Guests() {
  const navigate = useNavigate();

  const [currentMembersTable, setCurrentMembersTable] = React.useState<TableState>({
    data: [],
    loading: true,
    currentPage: 1,
    totalCount: 0
  });

  const [formerMembersTable, setFormerMembersTable] = React.useState<TableState>({
    data: [],
    loading: true,
    currentPage: 1,
    totalCount: 0
  });

  const [guestTable, setGuestTable] = React.useState<TableState>({
    data: [],
    loading: true,
    currentPage: 1,
    totalCount: 0
  });

  const [groupTable, setGroupTable] = React.useState<TableState>({
    data: [],
    loading: true,
    currentPage: 1,
    totalCount: 0
  });

  const fetchData = React.useCallback(async (
    category: string,
    setter: React.Dispatch<React.SetStateAction<TableState>>,
    includeInstrument: boolean = true
  ) => {
    try {
      const selectFields = includeInstrument 
        ? 'guest, guest_instrument, guest_id' 
        : 'guest, guest_id';
      
      const query = supabase
        .from('guests')
        .select(selectFields, { count: 'exact' })
        .eq('guest_category', category)
        .order('guest', { ascending: true });

      const { data, count, error } = await query;

      if (error) throw error;

      setter(prev => ({
        ...prev,
        data: (data as any[]) || [],
        totalCount: count || 0,
        loading: false
      }));
    } catch (error) {
      console.error(`Error fetching ${category.toLowerCase()}:`, error);
      setter(prev => ({ ...prev, loading: false }));
    }
  }, []);

  React.useEffect(() => {
    fetchData('Goose (current)', setCurrentMembersTable);
  }, [fetchData]);

  React.useEffect(() => {
    fetchData('Goose (former)', setFormerMembersTable);
  }, [fetchData]);

  React.useEffect(() => {
    fetchData('Guest', setGuestTable);
  }, [fetchData]);

  React.useEffect(() => {
    fetchData('Group', setGroupTable, false);
  }, [fetchData]);

  const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="text-center py-12 bg-primary border border-fourth">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse"></div>
        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-150"></div>
        <div className="w-4 h-4 rounded-lg bg-[#594e5f] animate-pulse delay-300"></div>
      </div>
      <p className="text-fifth mt-4">{text}</p>
    </div>
  );

  const DataTable = ({ 
    title, 
    data, 
    loading, 
    showInstrument = true
  }: { 
    title: string; 
    data: GuestData[]; 
    loading: boolean; 
    showInstrument?: boolean; 
  }) => {
    if (loading) {
      return <LoadingSpinner text={`Loading ${title.toLowerCase()}...`} />;
    }

    return (
      <div className="flex-1 min-w-0 bg-primary border border-fourth shadow-xl">
        <div className="bg-primary border border-fourth">
          <div className="bg-fourth text-white px-2 py-0.5">
            <h2 className="text-sm font-semibold">
              {title}
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {data.map((item, index) => (
                <tr key={item.guest} className={`${index % 2 === 0 ? 'bg-primary' : 'bg-primary'} hover:bg-tertiary/40 transition-colors text-[0.625rem]`}>
                  <td className="px-2 text-fifth whitespace-nowrap">
                    <Link 
                      to={`/personnel/${item.guest_id}`}
                      className="font-medium hover:underline transition-colors table-link cursor-pointer"
                    >
                      {item.guest}
                    </Link>
                  </td>
                  {showInstrument && (
                    <td className="px-2 text-fifth font-light whitespace-nowrap">
                      {item.guest_instrument}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  return (
    <>
      <Helmet>
        <title>Personnel — Dripfield.pro</title>
      </Helmet>
      <div className="w-full max-w-[1280px]">
      <div className="mb-4">
        <div className="bg-primary border border-fourth shadow-xl">
          <div className="bg-tertiary text-fifth pr-1 py-0.5 flex justify-between items-center">
            <h1 className="text-sm font-semibold pl-2">
              Personnel
            </h1>
            <GuestSearch />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="w-full">
            <DataTable 
              title="Current Goose Members"
              data={currentMembersTable.data}
              loading={currentMembersTable.loading}
              showInstrument={true}
            />
          </div>
          <div className="w-full">
            <DataTable 
              title="Former Goose Members"
              data={formerMembersTable.data}
              loading={formerMembersTable.loading}
              showInstrument={true}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="w-full">
            <DataTable 
              title="Guests"
              data={guestTable.data}
              loading={guestTable.loading}
              showInstrument={true}
            />
          </div>
          <div className="w-full">
            <DataTable 
              title="Groups"
              data={groupTable.data}
              loading={groupTable.loading}
              showInstrument={false}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}