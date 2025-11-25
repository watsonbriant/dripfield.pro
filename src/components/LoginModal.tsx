import React from 'react';

interface LoginModalProps {
    onClose: () => void;
    onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-primary border border-fourth rounded-lg p-3 max-w-sm mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-medium text-fifth mb-3">Login Required</h3>
                <p className="mb-4 text-fifth text-sm font-light">You must be logged in to rate this show.</p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-1 border border-fourth rounded-lg text-fifth hover:bg-red-500/50 transition-colors text-sm font-medium bg-red-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onLogin}
                        className="px-4 py-1 bg-tertiary border border-fourth rounded-lg text-fifth hover:bg-primary transition-colors text-sm font-medium"
                    >
                        Log In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
