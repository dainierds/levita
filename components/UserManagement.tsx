import React, { useState } from 'react';
import { User, Role, SubscriptionTier, TIER_LIMITS } from '../types';
import { UserPlus, Link, Shield, CheckCircle, Copy, Check, Trash2, AlertTriangle, Clock, X, User as UserIcon } from 'lucide-react'; // Added Clock, X
import { createInvitation, getPendingInvitations, deleteInvitation } from '../services/invitationService'; // Added imports
import { useNotification } from './NotificationSystem';
import { db } from '../services/firebase';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Invitation } from '../types'; // Check if imported

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tier: SubscriptionTier;
  currentUser: User;
}

const ROLES_TO_CREATE = [
  { key: 'ADMIN', label: 'Admin' },
  { key: 'ELDER', label: 'Ancianos' },
  { key: 'PREACHER', label: 'Predicadores' },
  { key: 'MUSIC', label: 'Música' },
  { key: 'AUDIO', label: 'Audio' },
];

const UserManagement: React.FC<UserManagementProps> = ({ users, setUsers, tier, currentUser }) => {
  const [formData, setFormData] = useState({ name: '', role: 'MEMBER' as Role });
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]); // New state

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
      addNotification('success', 'Invitación Cancelada', 'La invitación se ha borrado.');
    } catch (err) {
      console.error(err);
      addNotification('error', 'Error', 'No se pudo cancelar.');
    }
  };

  const handleGenerateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Tier Limits
    const limit = TIER_LIMITS[tier];
    if (users.length >= limit) {
      addNotification('error', 'Límite Alcanzado', `Tu plan ${tier} solo permite hasta ${limit} usuarios.`);
      return;
    }

    setIsLoading(true);
    setInvitationLink('');

    try {
      // Use current user's tenantId. If not set (e.g. Super Admin or mock), fallback to 'default'
      const tenantId = currentUser.tenantId || 'default';

      // Special handling for roles without interface (PREACHER)
      // These roles don't need an invitation link, they are just created directly for rostering.
      if (['PREACHER'].includes(formData.role)) {
        const newUserId = `local-${Math.random().toString(36).substr(2, 9)}`;
        const newUser: User = {
          id: newUserId,
          name: formData.name,
          email: '', // No email required for these roles
          role: formData.role,
          tenantId,
          status: 'ACTIVE'
        };

        await setDoc(doc(db, 'users', newUserId), newUser);
        addNotification('success', 'Usuario Agregado', `${formData.name} ha sido añadido al equipo.`);
        setFormData(prev => ({ ...prev, name: '' })); // Keep role, reset name
        setIsLoading(false);
        return;
      }

      const code = await createInvitation(tenantId, formData.role, formData.name, currentUser.id);

      // Construct the full link (assuming app is hosted at root or /app)
      // In dev: http://localhost:3000/join?code=...
      const origin = window.location.origin;
      const link = `${origin}/join?code=${code}`;

      setInvitationLink(link);
      addNotification('success', 'Invitación Generada', 'Copia el enlace y envíalo al nuevo usuario.');

      // Refresh list
      const invites = await getPendingInvitations(tenantId);
      setPendingInvitations(invites);

    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudo generar la invitación.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      // Optimistic update not strictly needed as onSnapshot in App.tsx will handle it, 
      // but setUsers is passed so we can use it if we want instant feedback before server sync.
      // However, since useUsers in App.tsx controls the source of truth, we rely on that.
      addNotification('success', 'Usuario Eliminado', 'El usuario ha sido removido correctamente.');
      setUserToDelete(null);
    } catch (error) {
      console.error(error);
      addNotification('error', 'Error', 'No se pudo eliminar el usuario.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h2>
        <p className="text-slate-500">
          Plan Actual: <span className="font-bold text-indigo-600">{tier}</span> •
          Usuarios: <span className={`${users.length >= TIER_LIMITS[tier] ? 'text-red-500 font-bold' : 'text-slate-700'}`}>{users.length} / {TIER_LIMITS[tier]}</span>
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Create Invitation Form */}
        <div className="lg:col-span-1 xl:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Link size={20} className="text-indigo-500" /> Invitar Usuario
          </h3>

          {!invitationLink ? (
            <form onSubmit={handleGenerateInvitation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Sugerido (Opcional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Ej. Baterista"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol a Asignar</label>
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
                      {r.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'MEMBER' })}
                    className={`px-2 py-2 text-xs font-bold rounded-lg transition-colors ${formData.role === 'MEMBER'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    Miembro
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Procesando...' :
                  ['PREACHER'].includes(formData.role) ? 'Agregar al Equipo' : 'Generar Link'}
              </button>
            </form>
          ) : (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4 text-center">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle size={20} />
                </div>
                <h4 className="font-bold text-green-800">¡Invitación Lista!</h4>
                <p className="text-xs text-green-600 mt-1">Comparte este enlace con el usuario.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 break-all text-xs font-mono text-slate-600">
                {invitationLink}
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <><Check size={18} /> Copiado</> : <><Copy size={18} /> Copiar Link</>}
              </button>

              <button
                onClick={() => { setInvitationLink(''); setFormData(prev => ({ ...prev, name: '' })); }}
                className="w-full py-3 mt-2 text-slate-400 font-bold hover:text-slate-600 text-xs"
              >
                Generar Otra
              </button>
            </div>
          )}
        </div>

        {/* Pending Invitations Card */}
        <div className="lg:col-span-1 xl:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-orange-500" /> Invitaciones ({pendingInvitations.length})
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {pendingInvitations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No hay invitaciones pendientes.</p>
            ) : (
              pendingInvitations.map((inv) => (
                <div key={inv.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{inv.suggestedName || 'Sin nombre'}</p>
                      <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">{inv.role}</span>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="Cancelar Invitación"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/join?code=${inv.id}`;
                      navigator.clipboard.writeText(link);
                      addNotification('success', 'Enlace Copiado', 'Link listo para compartir.');
                    }}
                    className="w-full py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Copy size={12} /> Copiar Link
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* User List - Grouped by Role */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-8">

          {(() => {
            // Define sections order and configuration
            const ROLE_SECTIONS = [
              { key: 'ADMIN', label: 'Administradores', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100' },
              { key: 'ELDER', label: 'Ancianos', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
              { key: 'PREACHER', label: 'Predicadores', icon: UserIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
              { key: 'MUSIC', label: 'Músicos & Vocales', icon: UserIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
              { key: 'AUDIO', label: 'Operadores de Audio', icon: UserIcon, color: 'text-orange-600', bg: 'bg-orange-100' },
              { key: 'MEMBER', label: 'Miembros', icon: UserIcon, color: 'text-slate-600', bg: 'bg-slate-100' },
            ];

            // Filter users into groups
            const groupedUsers = ROLE_SECTIONS.map(section => ({
              ...section,
              users: users.filter(u => u.role === section.key)
            })).filter(group => group.users.length > 0);

            if (groupedUsers.length === 0) {
              return (
                <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100 text-center text-slate-400">
                  <p>No hay usuarios registrados aún.</p>
                </div>
              );
            }

            return groupedUsers.map(group => (
              <div key={group.key} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className={`font-bold text-lg mb-6 flex items-center gap-2 ${group.color}`}>
                  <div className={`w-8 h-8 rounded-full ${group.bg} flex items-center justify-center`}>
                    <group.icon size={16} />
                  </div>
                  {group.label}
                  <span className="text-xs ml-auto bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{group.users.length}</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                        <th className="pb-4 pl-4">Usuario</th>
                        <th className="pb-4">Estado</th>
                        <th className="pb-4 text-right pr-4">Acciones</th>
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
                                <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                                <p className="text-[10px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              {u.status === 'ACTIVE' ? (
                                <>
                                  <CheckCircle size={14} className="text-green-500" />
                                  <span className="text-xs font-bold text-green-600">Activo</span>
                                </>
                              ) : (
                                <>
                                  <Shield size={14} className="text-orange-400" />
                                  <span className="text-xs font-bold text-orange-500">Pendiente</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-right pr-4">
                            {u.id !== currentUser.id && (
                              userToDelete === u.id ? (
                                <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4">
                                  <span className="text-xs font-bold text-red-500 mr-2">¿Seguro?</span>
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
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                  title="Eliminar Usuario"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )
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
    </div>
  );
};

export default UserManagement;
