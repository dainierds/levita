import React, { useState } from 'react';
import { User, Role, SubscriptionTier, TIER_LIMITS } from '../types';
import { UserPlus, Link, Shield, CheckCircle, Copy, Check, Trash2, AlertTriangle, Clock, X, User as UserIcon, BookOpen, Users, Edit2 } from 'lucide-react';
import { createInvitation, getPendingInvitations, deleteInvitation } from '../services/invitationService';
import { useNotification } from './NotificationSystem';
import { db } from '../services/firebase';
import { doc, deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Invitation, ChurchSettings } from '../types';
import { updateTenantSettings } from '../services/tenantService';
import { useLanguage } from '../context/LanguageContext';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tier: SubscriptionTier;
  currentUser: User;
  settings: ChurchSettings;
}

const ROLES_TO_CREATE = [
  { key: 'ADMIN', label: 'role.admin' },
  { key: 'ELDER', label: 'role.elder' },
  { key: 'PREACHER', label: 'role.preacher' },
  { key: 'MUSIC', label: 'role.music' },
  { key: 'AUDIO', label: 'role.audio' },
  { key: 'TEACHER', label: 'role.teacher' },
  { key: 'BOARD', label: 'role.board' },
  { key: 'LEADER', label: 'role.leader' },
];

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, tier, currentUser, settings }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ name: '', role: 'ELDER' as Role });
  // Custom Job State
  const [jobName, setJobName] = useState('');
  const [permMapping, setPermMapping] = useState<Role>('MEMBER');

  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);

  // Multi-Role Editing State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { addNotification } = useNotification();

  // Load Invitations effect
  React.useEffect(() => {
    const fetchInvitations = async () => {
      if (currentUser.tenantId) {
        try {
          const invites = await getPendingInvitations(currentUser.tenantId);
          setPendingInvitations(invites);
        } catch (err) {
          console.error("Error fetching invites", err);
        }
      }
    };
    fetchInvitations();
  }, [currentUser.tenantId]);

  const handleCancelInvitation = async (code: string) => {
    try {
      await deleteInvitation(code);
      setPendingInvitations(prev => prev.filter(i => i.id !== code));
      addNotification('success', t('common.deleted'), t('common.success'));
    } catch (err) {
      console.error(err);
      addNotification('error', t('common.error'), t('common.error'));
    }
  };

  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Tier Limits (Skipped for Role Creation)
    if (formData.role !== 'LEADER') {
      const limit = TIER_LIMITS[tier];
      if (users.length >= limit) {
        addNotification('error', t('common.limit_reached'), t('users.plan_info', { tier, current: users.length.toString(), max: limit.toString() }));
        return;
      }
    }

    setIsLoading(true);
    setInvitationLink('');

    try {
      const tenantId = currentUser.tenantId || 'default';

      // --- CUSTOM ROLE CREATION FLOW ---
      if (formData.role === 'LEADER') {
        if (!jobName.trim()) { addNotification('error', t('common.required'), t('users.role_name')); setIsLoading(false); return; }

        const newJob = {
          id: `job-${Math.random().toString(36).substr(2, 9)}`,
          name: jobName,
          permissionRole: permMapping
        };

        const currentJobs = settings.customJobRoles || [];
        await updateTenantSettings(tenantId, {
          ...settings,
          customJobRoles: [...currentJobs, newJob]
        });

        addNotification('success', t('common.success'), t('users.create_job'));
        setJobName('');
        setIsLoading(false);
        return;
      }

      // --- USER CREATION FLOW ---
      if (['PREACHER', 'TEACHER'].includes(formData.role)) {
        const newUserId = `local-${Math.random().toString(36).substr(2, 9)}`;
        const newUser: User = {
          id: newUserId,
          name: formData.name,
          email: '',
          role: formData.role,
          tenantId,
          status: 'ACTIVE'
        };

        await setDoc(doc(db, 'users', newUserId), newUser);
        addNotification('success', t('common.success'), t('users.add_to_team'));
        setFormData(prev => ({ ...prev, name: '' }));
        setIsLoading(false);
        return;
      }

      const code = await createInvitation(tenantId, formData.role, formData.name, currentUser.id);
      const origin = window.location.origin;
      const link = `${origin}/join?code=${code}`;

      setInvitationLink(link);
      addNotification('success', t('users.invitation_ready'), t('users.share_link'));

      const invites = await getPendingInvitations(tenantId);
      setPendingInvitations(invites);

    } catch (error) {
      console.error(error);
      addNotification('error', t('common.error'), t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const roleLabel = t(ROLES_TO_CREATE.find(r => r.key === formData.role)?.label || `role.${formData.role.toLowerCase()}`);
    const message = `Hola, has sido invitado a Levita por ${currentUser.name} como ${roleLabel}. Por favor, completa tu registro para acceder al panel de control: ${invitationLink}`;

    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      addNotification('success', t('common.deleted'), t('common.success'));
      setUserToDelete(null);
    } catch (error) {
      console.error(error);
      addNotification('error', t('common.error'), t('common.error'));
    }
  };

  // --- Multi-Role Logic ---
  const toggleSecondaryRole = (roleKey: string) => {
    if (!editingUser) return;
    const current = editingUser.secondaryRoles || [];
    const role = roleKey as Role;

    // Don't allow adding the primary role again
    if (role === editingUser.role) return;

    if (current.includes(role)) {
      setEditingUser({ ...editingUser, secondaryRoles: current.filter(r => r !== role) });
    } else {
      setEditingUser({ ...editingUser, secondaryRoles: [...current, role] });
    }
  };

  const toggleCustomJob = (jobId: string, permissionRole: Role) => {
    if (!editingUser) return;
    const currentJobs = editingUser.assignedJobIds || [];
    const currentRoles = editingUser.secondaryRoles || [];

    let newJobs = [];
    let newRoles = [...currentRoles];

    if (currentJobs.includes(jobId)) {
      // Remove Job
      newJobs = currentJobs.filter(id => id !== jobId);
      // NOTE: We don't remove the permission role automatically because user might have another job with same permission. 
      // Simplication: Keep permission for now.
    } else {
      // Add Job
      newJobs = [...currentJobs, jobId];
      // Add Permission if missing
      if (!newRoles.includes(permissionRole) && permissionRole !== 'MEMBER') {
        newRoles.push(permissionRole);
      }
    }
    setEditingUser({ ...editingUser, assignedJobIds: newJobs, secondaryRoles: newRoles });
  };

  const handleDeleteCustomJob = async (jobId: string) => {
    const tenantId = currentUser.tenantId || 'default';
    const currentJobs = settings.customJobRoles || [];
    const newJobs = currentJobs.filter(j => j.id !== jobId);

    try {
      await updateTenantSettings(tenantId, {
        ...settings,
        customJobRoles: newJobs
      });
      addNotification('success', t('common.deleted'), t('common.success'));
    } catch (error) {
      console.error(error);
      addNotification('error', t('common.error'), t('common.error'));
    }
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        secondaryRoles: editingUser.secondaryRoles || [],
        assignedJobIds: editingUser.assignedJobIds || []
      });
      addNotification('success', t('common.saved'), t('common.success'));
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating roles:", error);
      addNotification('error', t('common.error'), t('common.error'));
    }
  };


  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">{t('users.title')}</h2>
        <p className="text-slate-500">
          {t('users.plan_info', { tier, current: users.length.toString(), max: TIER_LIMITS[tier].toString() })}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Create Invitation Form */}
        <div className="lg:col-span-1 xl:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Link size={20} className="text-indigo-500" /> {formData.role === 'LEADER' ? t('users.create_role_title') : t('users.invite_title')}
          </h3>

          {!invitationLink ? (
            <form onSubmit={handleGenerateInvitation} className="space-y-4">
              {formData.role === 'LEADER' ? (
                // Custom Job Form
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('users.role_name')}</label>
                  <input
                    type="text"
                    value={jobName}
                    onChange={e => setJobName(e.target.value)}
                    className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-indigo-900"
                    placeholder="Ej. Director de Escuela Sabática"
                  />
                  <label className="block text-xs font-bold text-slate-500 uppercase mt-4 mb-1">{t('users.base_permissions')}</label>
                  <select
                    value={permMapping}
                    onChange={(e) => setPermMapping(e.target.value as Role)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none"
                  >
                    <option value="MEMBER">{t('role.member')}</option>
                    <option value="TEACHER">{t('role.teacher')}</option>
                    <option value="MUSIC">{t('role.music')}</option>
                    <option value="ELDER">{t('role.elder')}</option>
                    <option value="AUDIO">{t('role.audio')}</option>
                  </select>
                </div>
              ) : (
                // Normal User Form
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('users.suggested_name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="Ej. Baterista"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('users.primary_role')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES_TO_CREATE.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: r.key as Role })}
                      className={`px-2 py-2 text-xs font-bold rounded-lg transition-colors ${formData.role === r.key
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                      {t(r.label)}
                    </button>
                  ))}

                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? t('common.processing') :
                  formData.role === 'LEADER' ? t('users.create_job') :
                    ['PREACHER', 'TEACHER'].includes(formData.role) ? t('users.add_to_team') : t('users.generate_link')}
              </button>
            </form>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 text-center">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={20} />
                </div>
                <h4 className="font-bold text-green-800">{t('users.invitation_ready')}</h4>
                <p className="text-xs text-green-600 mt-1">{t('users.share_link')}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 break-all text-xs font-mono text-slate-600">
                {invitationLink}
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <><Check size={18} /> {t('common.link_copied')}</> : <><Copy size={18} /> {t('common.copy_link')}</>}
              </button>

              <button
                onClick={() => { setInvitationLink(''); setFormData(prev => ({ ...prev, name: '' })); }}
                className="w-full py-3 mt-2 text-slate-400 font-bold hover:text-slate-600 text-xs"
              >
                {t('common.create')} {t('common.back')}
              </button>
            </div>
          )}
        </div>

        {/* Pending Invitations Card */}
        <div className="lg:col-span-1 xl:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" /> {t('users.pending_invites')} ({pendingInvitations.length})
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {pendingInvitations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">{t('users.no_pending')}</p>
            ) : (
              pendingInvitations.map((inv) => (
                <div key={inv.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{inv.suggestedName || 'Sin nombre'}</p>
                      <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">{t(`role.${inv.role.toLowerCase()}`)}</span>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title={t('common.delete')}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/join?code=${inv.id}`;
                      const roleLabel = t(`role.${inv.role.toLowerCase()}`);
                      const message = `Hola, has sido invitado a Levita por ${currentUser.name} como ${roleLabel}. Por favor, completa tu registro para acceder al panel de control: ${link}`;

                      navigator.clipboard.writeText(message);
                      addNotification('success', t('common.link_copied'), t('users.copy_message'));
                    }}
                    className="w-full py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Copy size={12} /> {t('common.copy_link')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User List - Grouped by Role */}
        <div className="lg:col-span-2 xl:col-span-3 columns-1 md:columns-2 gap-6 space-y-6">

          {(() => {
            // Define sections order and configuration
            const ROLE_SECTIONS = [
              { key: 'ADMIN', label: 'users.role_admin', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100' },
              { key: 'ELDER', label: 'users.role_elders', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
              { key: 'PREACHER', label: 'users.role_preachers', icon: UserIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
              { key: 'MUSIC', label: 'users.role_music', icon: UserIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
              { key: 'AUDIO', label: 'users.role_audio', icon: UserIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
              { key: 'TEACHER', label: 'users.role_teachers', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { key: 'BOARD', label: 'users.role_board', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
              { key: 'LEADER', label: 'users.role_leaders', icon: Shield, color: 'text-cyan-600', bg: 'bg-cyan-100' },
            ];

            // Filter users into groups
            const groupedUsers = ROLE_SECTIONS.map(section => ({
              ...section,
              users: users.filter(u => u.role === section.key || u.secondaryRoles?.includes(section.key as Role))
                .sort((a, b) => a.name.localeCompare(b.name))
            })).filter(group => group.users.length > 0);

            if (groupedUsers.length === 0) {
              return (
                <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center text-slate-400">
                  <p>{t('common.no_results')}</p>
                </div>
              );
            }

            return groupedUsers.map(group => (
              <div key={group.key} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 break-inside-avoid mb-6">
                <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${group.color}`}>
                  <div className={`w-8 h-8 rounded-full ${group.bg} flex items-center justify-center`}>
                    <group.icon size={16} />
                  </div>
                  {t(group.label)}
                  <span className="text-xs ml-auto bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{group.users.length}</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th className="pb-4 pl-4">{t('role.usuario')}</th>
                        <th className="pb-4">{t('common.status')}</th>
                        <th className="pb-4 text-right pr-4">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.users.map((u) => (
                        <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${group.bg} ${group.color}`}>
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                  {u.name}
                                  {u.secondaryRoles && u.secondaryRoles.length > 0 && (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200" title="Roles Secundarios">
                                      +{u.secondaryRoles.length}
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {u.status === 'ACTIVE' ? (
                                <>
                                  <CheckCircle size={14} className="text-green-500" />
                                  <span className="text-xs font-bold text-green-600">{t('common.active')}</span>
                                </>
                              ) : (
                                <>
                                  <Shield size={14} className="text-orange-400" />
                                  <span className="text-xs font-bold text-orange-500">{t('common.pending')}</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-right pr-4">
                            {u.id !== currentUser.id && (
                              <div className="flex items-center justify-end gap-2">
                                {/* EDIT BUTTON - Multi-Role */}
                                <button
                                  onClick={() => setEditingUser(u)}
                                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                  title={t('common.edit')}
                                >
                                  <Edit2 size={16} />
                                </button>

                                {userToDelete === u.id ? (
                                  <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4">
                                    <span className="text-xs font-bold text-red-500 mr-2">{t('users.delete_confirm')}</span>
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      onClick={() => setUserToDelete(null)}
                                      className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                      <span className="text-xs font-bold">X</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setUserToDelete(u.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title={t('common.delete')}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* EDIT USER ROLES MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{t('users.edit_permissions')}</h3>
                <p className="text-slate-500">{t('users.edit_permissions_subtitle', { name: editingUser.name })}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('users.primary_role_fixed')}</p>
              <div className="flex items-center gap-2 font-bold text-slate-700">
                <Shield size={16} className="text-indigo-500" />
                {t(ROLES_TO_CREATE.find(r => r.key === editingUser.role)?.label || `role.${editingUser.role.toLowerCase()}`)}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase">{t('users.secondary_roles')}</p>
              <div className="grid grid-cols-2 gap-3">
                {ROLES_TO_CREATE.filter(r => r.key !== editingUser.role && r.key !== 'LEADER').map((option) => {
                  const isSelected = editingUser.secondaryRoles?.includes(option.key as Role);
                  return (
                    <button
                      key={option.key}
                      onClick={() => toggleSecondaryRole(option.key)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${isSelected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-sm font-bold">{t(option.label)}</span>
                      {isSelected && <CheckCircle size={16} className="text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Jobs Section */}
            {settings?.customJobRoles && settings.customJobRoles.length > 0 && (
              <div className="space-y-3 mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">{t('users.custom_jobs')}</p>
                <div className="grid grid-cols-1 gap-2">
                  {settings.customJobRoles.map((job) => {
                    const isSelected = editingUser.assignedJobIds?.includes(job.id);
                    return (
                      <div key={job.id} className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCustomJob(job.id, job.permissionRole)}
                          className={`flex-1 p-3 rounded-xl border flex items-center justify-between transition-all ${isSelected
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <div className="text-left">
                            <span className="text-sm font-bold block">{job.name}</span>
                            <span className="text-[10px] text-slate-400">Permiso Base: {t(`role.${job.permissionRole.toLowerCase()}`)}</span>
                          </div>
                          {isSelected && <CheckCircle size={16} className="text-emerald-600" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCustomJob(job.id)}
                          className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSaveRoles}
                className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-lg"
              >
                {t('common.save_changes')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
