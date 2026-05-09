import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';

const NotificationDropdown = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col max-h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Bell size={18} className="text-orange-500" /> Notifications
        </h3>
        <div className="flex items-center gap-3">
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 flex flex-col items-center">
            <Bell size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No new notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-4 transition-colors ${notification.is_read ? 'bg-white opacity-70' : 'bg-orange-50/30'}`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`mt-1 flex-shrink-0 ${notification.is_read ? 'text-gray-400' : 'text-orange-500'}`}>
                    {notification.type === 'bill_request' ? <AlertCircle size={18} /> : <Bell size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${notification.is_read ? 'text-gray-600' : 'text-gray-800 font-semibold'}`}>
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                        <Clock size={10} /> 
                        {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!notification.is_read && (
                        <button 
                          onClick={() => onMarkAsRead(notification.id)}
                          className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
