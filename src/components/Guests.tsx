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
          <p className="text-[#fce7ca]/70">Loading members...</p>
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">
          Current Goose Members
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">Member</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90 whitespace-nowrap">Instruments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentMembersTable.members.map((member, index) => (
                <tr key={member.guest} className={`${index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'} hover:bg-white/10 transition-colors text-xs`}>
                  <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                    <span 
                      className="font-semibold hover:underline cursor-pointer"
                      onClick={() => navigate(`/guest/${member.guest_id}`)}
                    >
                      {member.guest}
                    </span>
                  </td>
                  <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">{member.guest_instrument}</td>
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
          <p className="text-[#fce7ca]/70">Loading members...</p>
        </div>
      );
    }
  
    return (
      <div className="flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">
          Former Goose Members
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90">Member</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90">Instruments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {formerMembersTable.members.map((member, index) => (
                <tr
                  key={member.guest}
                  className={`${
                    index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                  } hover:bg-white/10 transition-colors text-xs`}
                >
                  <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                    <span 
                      className="font-semibold hover:underline cursor-pointer"
                      onClick={() => navigate(`/guest/${member.guest_id}`)}
                    >
                      {member.guest}
                    </span>
                  </td>
                  <td className="px-4 py-1 text-[#fce7ca]/90">
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
          <p className="text-[#fce7ca]/70">Loading guests...</p>
        </div>
      );
    }
  
    return (
      <div className="flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">
          Guests
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90">Guest</th>
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90">Instruments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {guestTable.guests.map((guest, index) => (
                <tr
                  key={guest.guest}
                  className={`${
                    index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                  } hover:bg-white/10 transition-colors text-xs`}
                >
                  <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                    <span 
                      className="font-semibold hover:underline cursor-pointer"
                      onClick={() => navigate(`/guest/${guest.guest_id}`)}
                    >
                      {guest.guest}
                    </span>
                  </td>
                  <td className="px-4 py-1 text-[#fce7ca]/90">
                    {guest.guest_instrument}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
  
        <div className="mt-4 flex items-center justify-between px-4">
          <div className="text-sm text-[#fce7ca]/70">
            Showing {(guestTable.currentPage - 1) * guestsPerPage + 1}-{Math.min(guestTable.currentPage * guestsPerPage, guestTable.totalCount)} of {guestTable.totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGuestTable(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={guestTable.currentPage === 1}
              className={`p-1 rounded-md transition-colors ${
                guestTable.currentPage === 1
                  ? 'text-[#fce7ca]/30 cursor-not-allowed'
                  : 'text-[#fce7ca]/70 hover:text-[#fce7ca] hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#fce7ca]/90">
              Page {guestTable.currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setGuestTable(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={guestTable.currentPage === totalPages}
              className={`p-1 rounded-md transition-colors ${
                guestTable.currentPage === totalPages
                  ? 'text-[#fce7ca]/30 cursor-not-allowed'
                  : 'text-[#fce7ca]/70 hover:text-[#fce7ca] hover:bg-white/10'
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
          <p className="text-[#fce7ca]/70">Loading groups...</p>
        </div>
      );
    }
  
    return (
      <div className="flex-1 min-w-0 bg-[#172330] border border-white/10 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white/90 mb-4">
          Groups
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr className="bg-[#0e151b] border-y border-white/10">
                <th className="px-4 py-2 text-left text-s font-semibold text-white/90">Group</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {groupTable.groups.map((group, index) => (
                <tr
                  key={group.guest}
                  className={`${
                    index % 2 === 0 ? 'bg-primary/30' : 'bg-[#0c151c]'
                  } hover:bg-white/10 transition-colors text-xs`}
                >
                  <td className="px-4 py-1 text-[#fce7ca]/90 whitespace-nowrap">
                    <span 
                      className="font-semibold hover:underline cursor-pointer"
                      onClick={() => navigate(`/guest/${group.guest_id}`)}
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
          <div className="text-sm text-[#fce7ca]/70">
            Showing {(groupTable.currentPage - 1) * guestsPerPage + 1}-{Math.min(groupTable.currentPage * guestsPerPage, groupTable.totalCount)} of {groupTable.totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupTable(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={groupTable.currentPage === 1}
              className={`p-1 rounded-md transition-colors ${
                groupTable.currentPage === 1
                  ? 'text-[#fce7ca]/30 cursor-not-allowed'
                  : 'text-[#fce7ca]/70 hover:text-[#fce7ca] hover:bg-white/10'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-[#fce7ca]/90">
              Page {groupTable.currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setGroupTable(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={groupTable.currentPage === totalPages}
              className={`p-1 rounded-md transition-colors ${
                groupTable.currentPage === totalPages
                  ? 'text-[#fce7ca]/30 cursor-not-allowed'
                  : 'text-[#fce7ca]/70 hover:text-[#fce7ca] hover:bg-white/10'
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
        <h1 className="text-2xl md:text-3xl font-bold text-white">Guests</h1>
        <GuestSearch />
      </div>

      <div className="flex flex-col gap-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="w-full">
            <CurrentMembersTable />
          </div>
          <div className="w-full">
            <FormerMembersTable />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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