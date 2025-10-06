import React from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GuestSearch } from './GuestSearch';

interface Guest {
  guest: string;
  guest_category: string;
  guest_instrument: string;
  guest_id?: number;
}

interface CurrentMember {
  guest: string;
  guest_instrument: string;
  guest_id?: number;
}

interface FormerMemberTableState {
  members: CurrentMember[];
  loading: boolean;
}

interface GuestData {
  guest: string;
  guest_instrument: string;
  guest_id?: number;
}

interface GuestTableState {
  guests: GuestData[];
  loading: boolean;
  currentPage: number;
  totalCount: number;
}

interface GroupData {
  guest: string;
  guest_id?: number;
}

interface GroupTableState {
  groups: GroupData[];
  loading: boolean;
  currentPage: number;
  totalCount: number;
}

type SortField = 'guest' | 'guest_category' | 'guest_instrument';
type SortDirection = 'asc' | 'desc';

type TableType = 'current' | 'percussion';

interface TableState {
  guests: Guest[];
  loading: boolean;
  currentPage: number;
  totalCount: number;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface CurrentMemberTableState {
  members: CurrentMember[];
  loading: boolean;
}

export function Guests() {
  const navigate = useNavigate();
  const guestsPerPage = 50;

  const [currentMembersTable, setCurrentMembersTable] = React.useState<CurrentMemberTableState>({
    members: [],
    loading: true
  });

  const [formerMembersTable, setFormerMembersTable] = React.useState<FormerMemberTableState>({
    members: [],
    loading: true
  });

  const [guestTable, setGuestTable] = React.useState<GuestTableState>({
    guests: [],
    loading: true,
    currentPage: 1,
    totalCount: 0
  });

  const [groupTable, setGroupTable] = React.useState<GroupTableState>({
    groups: [],
    loading: true,
    currentPage: 1,
    totalCount: 0
  });

  React.useEffect(() => {
    async function fetchCurrentMembers() {
      try {
        const { data, error } = await supabase
          .from('guests')
          .select('guest, guest_instrument, guest_id')
          .eq('guest_category', 'Goose (current)')
          .order('guest', { ascending: true });

        if (error) throw error;

        setCurrentMembersTable({
          members: data || [],
          loading: false
        });
      } catch (error) {
        console.error('Error fetching current members:', error);
        setCurrentMembersTable(prev => ({ ...prev, loading: false }));
      }
    }

    fetchCurrentMembers();
  }, []);

  React.useEffect(() => {
    async function fetchFormerMembers() {
      try {
        const { data, error } = await supabase
          .from('guests')
          .select('guest, guest_instrument, guest_id')
          .eq('guest_category', 'Goose (former)')
          .order('guest', { ascending: true });
  
        if (error) throw error;
  
        setFormerMembersTable({
          members: data || [],
          loading: false
        });
      } catch (error) {
        console.error('Error fetching former members:', error);
        setFormerMembersTable(prev => ({ ...prev, loading: false }));
      }
    }
  
    fetchFormerMembers();
  }, []);

  React.useEffect(() => {
    async function fetchGuests() {
      try {
        const { data, count, error } = await supabase
          .from('guests')
          .select('guest, guest_instrument, guest_id', { count: 'exact' })
          .eq('guest_category', 'Guest')
          .order('guest', { ascending: true })
          .range((guestTable.currentPage - 1) * guestsPerPage, guestTable.currentPage * guestsPerPage - 1);
  
        if (error) throw error;
  
        setGuestTable(prev => ({
          ...prev,
          guests: data || [],
          totalCount: count || 0,
          loading: false
        }));
      } catch (error) {
        console.error('Error fetching guests:', error);
        setGuestTable(prev => ({ ...prev, loading: false }));
      }
    }
  
    fetchGuests();
  }, [guestTable.currentPage]);

  React.useEffect(() => {
    async function fetchGroups() {
      try {
        const { data, count, error } = await supabase
          .from('guests')
          .select('guest, guest_id', { count: 'exact' })
          .eq('guest_category', 'Group')
          .order('guest', { ascending: true })
          .range((groupTable.currentPage - 1) * guestsPerPage, groupTable.currentPage * guestsPerPage - 1);
  
        if (error) throw error;
  
        setGroupTable(prev => ({
          ...prev,
          groups: data || [],
          totalCount: count || 0,
          loading: false
        }));
      } catch (error) {
        console.error('Error fetching groups:', error);
        setGroupTable(prev => ({ ...prev, loading: false }));
      }
    }
  
    fetchGroups();
  }, [groupTable.currentPage]);

  const CurrentMembersTable = () => {
    if (currentMembersTable.loading) {
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading members...</p>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0 bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          Current Goose Members
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {currentMembersTable.members.map((member, index) => (
                <tr key={member.guest} className={`${index % 2 === 0 ? 'bg-primary' : 'bg-canvas'} hover:bg-tertiary/40 transition-colors text-xs`}>
                  <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                    <span 
                      className="font-medium hover:underline transition-colors table-link cursor-pointer"
                      onClick={() => navigate(`/personnel/${member.guest_id}`)}
                    >
                      {member.guest}
                    </span>
                  </td>
                  <td className="px-4 py-0.5 text-fifth font-light whitespace-nowrap">{member.guest_instrument}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const FormerMembersTable = () => {
    if (formerMembersTable.loading) {
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading members...</p>
        </div>
      );
    }
  
    return (
      <div className="flex-1 min-w-0 bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          Former Goose Members
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {formerMembersTable.members.map((member, index) => (
                <tr
                  key={member.guest}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                    <span 
                      className="font-medium hover:underline transition-colors table-link cursor-pointer"
                      onClick={() => navigate(`/personnel/${member.guest_id}`)}
                    >
                      {member.guest}
                    </span>
                  </td>
                  <td className="px-4 py-0.5 font-light text-fifth">
                    {member.guest_instrument}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const GuestsListTable = () => {
    const totalPages = Math.ceil(guestTable.totalCount / guestsPerPage);
  
    if (guestTable.loading) {
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading guests...</p>
        </div>
      );
    }
  
    return (
      <div className="flex-1 min-w-0 bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          Guests
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {guestTable.guests.map((guest, index) => (
                <tr
                  key={guest.guest}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                    <span 
                      className="font-medium hover:underline transition-colors table-link cursor-pointer"
                      onClick={() => navigate(`/personnel/${guest.guest_id}`)}
                    >
                      {guest.guest}
                    </span>
                  </td>
                  <td className="px-4 py-0.5 text-fifth font-light">
                    {guest.guest_instrument}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm font-light text-fifth">
            Showing {(guestTable.currentPage - 1) * guestsPerPage + 1}-{Math.min(guestTable.currentPage * guestsPerPage, guestTable.totalCount)} of {guestTable.totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuestTable(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={guestTable.currentPage === 1}
              className={`p-1 rounded-md transition-colors ${
                guestTable.currentPage === 1
                  ? 'text-fifth/30 cursor-not-allowed'
                  : 'text-fifth hover:underline hover:bg-tertiary/40'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-light text-fifth">
              Page {guestTable.currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setGuestTable(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={guestTable.currentPage === totalPages}
              className={`p-1 rounded-md transition-colors ${
                guestTable.currentPage === totalPages
                  ? 'text-fifth/30 cursor-not-allowed'
                  : 'text-fifth hover:underline hover:bg-tertiary/40'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const GroupsTable = () => {
    const totalPages = Math.ceil(groupTable.totalCount / guestsPerPage);
  
    if (groupTable.loading) {
      return (
        <div className="text-center py-12">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-150"></div>
            <div className="w-4 h-4 rounded-full bg-[#594e5f] animate-pulse delay-300"></div>
          </div>
          <p className="text-fifth mt-4">Loading groups...</p>
        </div>
      );
    }
  
    return (
      <div className="flex-1 min-w-0 bg-primary border border-secondary rounded-lg p-3">
        <h2 className="text-xl font-semibold bg-tertiary text-fifth inline-block px-3 py-0.5 rounded-lg border border-secondary mb-2">
          Groups
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <tbody className="divide-y divide-white/5">
              {groupTable.groups.map((group, index) => (
                <tr
                  key={group.guest}
                  className={`${
                    index % 2 === 0 ? 'bg-primary' : 'bg-canvas'
                  } hover:bg-tertiary/40 transition-colors text-xs`}
                >
                  <td className="px-4 py-0.5 text-fifth whitespace-nowrap">
                    <span 
                      className="font-medium hover:underline transition-colors table-link cursor-pointer"
                      onClick={() => navigate(`/personnel/${group.guest_id}`)}
                    >
                      {group.guest}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm font-light text-fifth">
            Showing {(groupTable.currentPage - 1) * guestsPerPage + 1}-{Math.min(groupTable.currentPage * guestsPerPage, groupTable.totalCount)} of {groupTable.totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupTable(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={groupTable.currentPage === 1}
              className={`p-1 rounded-md transition-colors ${
                groupTable.currentPage === 1
                  ? 'text-fifth/30 cursor-not-allowed'
                  : 'text-fifth hover:underline hover:bg-tertiary/40'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-light text-fifth">
              Page {groupTable.currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setGroupTable(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={groupTable.currentPage === totalPages}
              className={`p-1 rounded-md transition-colors ${
                groupTable.currentPage === totalPages
                  ? 'text-fifth/30 cursor-not-allowed'
                  : 'text-fifth hover:underline hover:bg-tertiary/40'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1280px] mx-auto">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-2xl font-semibold bg-tertiary text-fifth inline-block px-4 py-1 rounded-lg border border-secondary">Guests</h1>
        <GuestSearch />
      </div>

      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="w-full">
            <CurrentMembersTable />
          </div>
          <div className="w-full">
            <FormerMembersTable />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="w-full">
            <GuestsListTable />
          </div>
          <div className="w-full">
            <GroupsTable />
          </div>
        </div>
      </div>
    </div>
  );
}