import React from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const guestsPerPage = 50;

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
    currentPage: number,
    includeInstrument: boolean = true
  ) => {
    try {
      const selectFields = includeInstrument 
        ? 'guest, guest_instrument, guest_id' 
        : 'guest, guest_id';
      
      let query = supabase
        .from('guests')
        .select(selectFields, { count: 'exact' })
        .eq('guest_category', category)
        .order('guest', { ascending: true });

      if (category === 'Guest' || category === 'Group') {
        query = query.range((currentPage - 1) * guestsPerPage, currentPage * guestsPerPage - 1);
      }

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
  }, [guestsPerPage]);

  React.useEffect(() => {
    fetchData('Goose (current)', setCurrentMembersTable, 1);
  }, [fetchData]);

  React.useEffect(() => {
    fetchData('Goose (former)', setFormerMembersTable, 1);
  }, [fetchData]);

  React.useEffect(() => {
    fetchData('Guest', setGuestTable, guestTable.currentPage);
  }, [fetchData, guestTable.currentPage]);

  React.useEffect(() => {
    fetchData('Group', setGroupTable, groupTable.currentPage, false);
  }, [fetchData, groupTable.currentPage]);

  const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="text-center py-12">
      <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
        <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
      </div>
      <p className="text-fifth mt-4">{text}</p>
    </div>
  );

  const PaginationControls = ({ 
    currentPage, 
    totalPages, 
    totalCount, 
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    totalCount: number; 
    onPageChange: (page: number) => void; 
  }) => (
    <div className="mt-4 flex items-center justify-between px-4">
      <div className="text-sm font-light text-fifth">
        Showing {(currentPage - 1) * guestsPerPage + 1}-{Math.min(currentPage * guestsPerPage, totalCount)} of {totalCount}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-1 rounded-md transition-colors ${
            currentPage === 1
              ? 'text-fifth/30 cursor-not-allowed'
              : 'text-fifth hover:underline hover:bg-tertiary/40'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-light text-fifth">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-1 rounded-md transition-colors ${
            currentPage === totalPages
              ? 'text-fifth/30 cursor-not-allowed'
              : 'text-fifth hover:underline hover:bg-tertiary/40'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const DataTable = ({ 
    title, 
    data, 
    loading, 
    showInstrument = true, 
    showPagination = false, 
    currentPage = 1, 
    totalCount = 0, 
    onPageChange 
  }: { 
    title: string; 
    data: GuestData[]; 
    loading: boolean; 
    showInstrument?: boolean; 
    showPagination?: boolean; 
    currentPage?: number; 
    totalCount?: number; 
    onPageChange?: (page: number) => void; 
  }) => {
    if (loading) {
      return <LoadingSpinner text={`Loading ${title.toLowerCase()}...`} />;
    }

    const totalPages = Math.ceil(totalCount / guestsPerPage);

    return (
      <div className="flex-1 min-w-0 bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          {title}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {data.map((item, index) => (
                <tr key={item.guest} className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-tertiary/40 transition-colors text-xs`}>
                  <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                    <span 
                      className="font-medium hover:underline transition-colors table-link cursor-pointer"
                      onClick={() => navigate(`/personnel/${item.guest_id}`)}
                    >
                      {item.guest}
                    </span>
                  </td>
                  {showInstrument && (
                    <td className="px-4 py-0.5 text-fifth font-light whitespace-nowrap">
                      {item.guest_instrument}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showPagination && onPageChange && (
          <PaginationControls 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalCount={totalCount} 
            onPageChange={onPageChange} 
          />
        )}
      </div>
    );
  };


  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Guests</h1>
        <GuestSearch />
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
              showPagination={true}
              currentPage={guestTable.currentPage}
              totalCount={guestTable.totalCount}
              onPageChange={(page) => setGuestTable(prev => ({ ...prev, currentPage: page }))}
            />
          </div>
          <div className="w-full">
            <DataTable 
              title="Groups"
              data={groupTable.data}
              loading={groupTable.loading}
              showInstrument={false}
              showPagination={true}
              currentPage={groupTable.currentPage}
              totalCount={groupTable.totalCount}
              onPageChange={(page) => setGroupTable(prev => ({ ...prev, currentPage: page }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}