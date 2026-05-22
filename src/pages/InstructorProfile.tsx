import { useState, useEffect } from "react";
import type { PageKey } from "@/types";
import { instructorCourseApi, uploadApi } from "@/api";
import Footer from "@/components/Footer";

interface Props {
  goTo: (page: PageKey, id?: number) => void;
  onUpdate: (updated: { avatar_url?: string; name?: string }) => void;
}

interface ProfileForm {
  name:       string;
  bio:        string;
  avatar_url: string;
}

export default function InstructorProfile({ goTo, onUpdate }: Props) {
  const [form, setForm]         = useState<ProfileForm>({ name: "", bio: "", avatar_url: "" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    instructorCourseApi.getProfile()
      .then((res) => {
        if (res.data) {
          setForm({
            name:       res.data.name ?? "",
            bio:        res.data.bio ?? "",
            avatar_url: res.data.avatar_url ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadApi.avatar(file);
      setForm((p) => ({ ...p, avatar_url: url }));
    } catch (e) { alert((e as Error).message); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("이름을 입력해주세요."); return; }
    setSaving(true);
    try {
      await instructorCourseApi.updateProfile(form);
      onUpdate({ avatar_url: form.avatar_url, name: form.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ paddingTop: 80, paddingRight: 120, paddingBottom: 120, paddingLeft: 120, textAlign: "center", color: "var(--mid)" }}>
      불러오는 중...
    </div>
  );

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh" }}>
      <div style={{ background: "var(--dark)", padding: "48px 80px 36px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--terra)", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>강사</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(28px,3vw,40px)", fontWeight: 300, color: "var(--cream)" }}>
          내 <em style={{ fontStyle: "italic", color: "var(--sand)" }}>프로필</em>
        </h1>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "52px 24px 80px" }}>

        {/* 프로필 사진 */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 36, padding: 24, background: "white", borderRadius: 16, border: "1px solid var(--sand)" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "var(--lsage)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {form.avatar_url
              ? <img src={form.avatar_url} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 32 }}>🧘</span>
            }
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{form.name || "강사명"}</div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", border: "1px solid var(--sand)", borderRadius: 100, fontSize: 13, color: "var(--mid)", cursor: "pointer" }}>
              <span>📷</span>
              <span>{uploading ? "업로드 중..." : "사진 변경"}</span>
              <input type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
            </label>
            {form.avatar_url && (
              <button onClick={() => setForm((p) => ({ ...p, avatar_url: "" }))}
                style={{ marginLeft: 8, fontSize: 12, color: "#c33", background: "none", border: "none", cursor: "pointer" }}>
                제거
              </button>
            )}
          </div>
        </div>

        {/* 이름 */}
        <Field label="이름">
          <input
            style={S.input}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="강사 이름"
          />
        </Field>

        {/* 소개글 */}
        <Field label="소개글">
          <textarea
            style={{ ...S.input, minHeight: 120, resize: "vertical" }}
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="강사 소개를 입력하세요. 수강생들에게 보여집니다."
          />
        </Field>

        {/* 저장 버튼 */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
          <button onClick={() => goTo("instructor")}
            style={{ padding: "12px 24px", background: "none", border: "1.5px solid var(--sand)", borderRadius: 100, fontSize: 14, cursor: "pointer", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif" }}>
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "12px 28px", background: saved ? "var(--deep)" : "var(--dark)", color: "var(--cream)", border: "none", borderRadius: 100, fontSize: 14, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", transition: "background 0.2s" }}>
            {saved ? "✓ 저장됨" : saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>

      <Footer goTo={goTo} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--mid)", marginBottom: 7, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  input: { width: "100%", padding: "11px 14px", border: "1.5px solid var(--sand)", borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "var(--dark)", background: "white" },
};
