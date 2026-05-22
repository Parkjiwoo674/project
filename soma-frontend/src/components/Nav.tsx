import { useState, useEffect, useRef } from "react";
import type { PageKey, User } from "@/types";
import { notificationApi, type Notification } from "@/api";

interface NavProps {
  goTo:     (page: PageKey) => void;
  user:     User | null;
  onLogout: () => void;
}

export default function Nav({ goTo, user, onLogout }: NavProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 불러오기
  const fetchNotifications = async () => {
    if (!user || user.role !== "user") return;
    try {
      const res = await notificationApi.list();
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error("알림 불러오기 실패:", err);
    }
  };

  // 30초마다 폴링
  useEffect(() => {
    if (!user || user.role !== "user") return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // 알림 읽음 처리
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("알림 읽음 처리 실패:", err);
    }
  };

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error("모두 읽음 처리 실패:", err);
    }
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "course_deleted": return "🗑️";
      case "refund": return "💰";
      case "qna_answer": return "💬";
      case "announcement": return "📢";
      default: return "🔔";
    }
  };

  // 시간 포맷
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <nav style={S.nav}>
      <span style={S.logo} onClick={() => goTo("home")}>
        SŌ<span style={{ color: "var(--terra)" }}>MA</span>
      </span>

      <ul style={S.links}>
        {user?.role !== "instructor" && user?.role !== "admin" && <li><button style={S.link} onClick={() => goTo("courses")}>강의</button></li>}
        {user?.role === "instructor" && <li><button style={S.link} onClick={() => goTo("instructor")}>내 강의 관리</button></li>}
        {user?.role === "user" && <li><button style={S.link} onClick={() => goTo("my")}>내 수업</button></li>}
        {user?.role === "user" && <li><button style={S.link} onClick={() => goTo("wishlist")}>찜 목록</button></li>}
        {user?.role === "admin" && <li><button style={S.link} onClick={() => goTo("admin")}>관리자 대시보드</button></li>}
        {!user && <li><button style={S.link} onClick={() => goTo("courses")}>강의</button></li>}
        {!user ? (
          <li>
            <button style={S.cta} onClick={() => goTo("auth")}>로그인 / 가입</button>
          </li>
        ) : (
          <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--mid)", cursor: "pointer" }}
              onClick={() => user.role === "instructor" ? goTo("instructor-profile") : user.role === "user" ? goTo("student-profile") : undefined}>
              {user.nickname}님
            </span>
            {user.role === "instructor" && (
              <span style={{ fontSize: 10, background: "var(--terra)", color: "white", padding: "2px 8px", borderRadius: 100, fontWeight: 500, cursor: "pointer" }}
                onClick={() => goTo("instructor-profile")}>강사</span>
            )}
            {user.role === "admin" && (
              <span style={{ fontSize: 10, background: "var(--deep)", color: "white", padding: "2px 8px", borderRadius: 100, fontWeight: 500 }} onClick={() => goTo("student-profile")}>관리자</span>
            )}
            <button style={S.avatar} onClick={onLogout} title="로그아웃">
              {user.avatar_url
                ? <img src={user.avatar_url} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : "🌿"
              }
            </button>

            {/* 알림 벨 (수강생만) - 프로필 오른쪽 */}
            {user.role === "user" && (
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  style={S.bellButton}
                  onClick={() => setShowDropdown(!showDropdown)}
                  title="알림"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span style={S.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </button>

                {showDropdown && (
                  <div style={S.dropdown}>
                    <div style={S.dropdownHeader}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>알림</span>
                      {unreadCount > 0 && (
                        <button style={S.markAllBtn} onClick={handleMarkAllAsRead}>
                          모두 읽음
                        </button>
                      )}
                    </div>

                    <div style={S.notificationList}>
                      {notifications.length === 0 ? (
                        <div style={S.emptyState}>알림이 없습니다</div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            style={{
                              ...S.notificationItem,
                              background: notif.is_read ? "white" : "rgba(138,158,126,0.08)",
                            }}
                            onClick={() => {
                              if (!notif.is_read) handleMarkAsRead(notif.id);
                              if (notif.link) {
                                // 링크가 있으면 해당 페이지로 이동
                                const match = notif.link.match(/\/courses\/(\d+)/);
                                if (match) {
                                  goTo("detail");
                                }
                              }
                              setShowDropdown(false);
                            }}
                          >
                            <div style={S.notifIcon}>{getNotificationIcon(notif.type)}</div>
                            <div style={{ flex: 1 }}>
                              <div style={S.notifTitle}>{notif.title}</div>
                              <div style={S.notifMessage}>{notif.message}</div>
                              <div style={S.notifTime}>{formatTime(notif.created_at)}</div>
                            </div>
                            {!notif.is_read && <div style={S.unreadDot} />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}

const S: Record<string, React.CSSProperties> = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px 60px",
    background: "rgba(250,248,244,0.9)", backdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(138,158,126,0.15)",
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 300,
    letterSpacing: "0.25em", cursor: "pointer", color: "var(--dark)",
  },
  links: { display: "flex", gap: 32, listStyle: "none", alignItems: "center" },
  link: {
    fontSize: 13, color: "var(--mid)", cursor: "pointer", background: "none",
    border: "none", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em",
  },
  cta: {
    background: "var(--deep)", color: "#fff", padding: "10px 22px",
    borderRadius: 100, fontSize: 13, fontWeight: 500, cursor: "pointer",
    border: "none", fontFamily: "'DM Sans', sans-serif",
  },
  avatar: {
    width: 34, height: 34, borderRadius: "50%", background: "var(--lsage)",
    border: "2px solid var(--sage)", fontSize: 16, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  bellButton: {
    position: "relative",
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    color: "var(--mid)",
    transition: "color 0.2s",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    background: "#e74c3c",
    color: "white",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 5px",
    borderRadius: 100,
    minWidth: 16,
    textAlign: "center",
    lineHeight: 1,
  },
  dropdown: {
    position: "absolute",
    top: 45,
    right: 0,
    width: 360,
    maxHeight: 480,
    background: "white",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    border: "1px solid rgba(138,158,126,0.2)",
    overflow: "hidden",
    zIndex: 1000,
  },
  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(138,158,126,0.15)",
  },
  markAllBtn: {
    fontSize: 12,
    color: "var(--sage)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  },
  notificationList: {
    maxHeight: 400,
    overflowY: "auto",
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: "var(--mid)",
    fontSize: 13,
  },
  notificationItem: {
    display: "flex",
    gap: 12,
    padding: "16px 20px",
    borderBottom: "1px solid rgba(138,158,126,0.1)",
    cursor: "pointer",
    transition: "background 0.2s",
    position: "relative",
  },
  notifIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--dark)",
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 12,
    color: "var(--mid)",
    lineHeight: 1.5,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: "var(--mid)",
    opacity: 0.7,
  },
  unreadDot: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--sage)",
  },
};