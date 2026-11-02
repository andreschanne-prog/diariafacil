import { useState } from 'react';
import { auth, db } from '../firebase.js';
import { deleteUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DeletarConta() {
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const WORD_TO_CONFIRM = 'DELETAR';
  const isConfirmed = confirmText.trim().toUpperCase() === WORD_TO_CONFIRM;

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!isConfirmed) return;

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError('Nenhum usuário autenticado no momento.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uid = currentUser.uid;
      const email = currentUser.email;

      // 1. Salva o motivo e os dados da exclusão no Firestore (para o painel do Admin ver)
      await setDoc(doc(db, 'account_deletions', uid), {
        uid: uid,
        email: email || 'Não informado',
        reason: reason.trim() || 'Nenhum motivo informado',
        deletedAt: serverTimestamp()
      });

      // 2. (Opcional) Se você quiser apagar o documento do perfil do usuário do Firestore antes de deletar o Auth:
      // await deleteDoc(doc(db, 'users', uid));

      // 3. Deleta o usuário do Firebase Auth
      await deleteUser(currentUser);

      // 4. Redireciona após a exclusão
      window.location.href = '/login?status=deleted';
    } catch (err) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Por razões de segurança, faça login novamente na sua conta antes de tentar excluí-la.');
      } else {
        setError(err.message || 'Erro ao excluir a conta. Tente novamente.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 text-red-600 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg">
          <Trash2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Excluir Conta</h1>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Atenção: Esta ação é irreversível.</p>
            <p>
              Ao confirmar a exclusão, seu perfil, acesso e dados serão permanentemente removidos.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleDeleteAccount} className="space-y-4">
        {/* Campo de Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Por que você está excluindo sua conta? <span className="text-gray-400 text-xs">(Opcional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Conte-nos o motivo para nos ajudar a melhorar..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
          />
        </div>

        {/* Campo de Confirmação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Para confirmar, digite <span className="font-bold text-gray-900 dark:text-white">{WORD_TO_CONFIRM}</span> no campo abaixo:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Digite ${WORD_TO_CONFIRM}`}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={!isConfirmed || loading}
            className="flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir Minha Conta'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}