/**
 * PortfolioTemplate — PDF 출력용 포트폴리오 렌더링
 * 박성근 포트폴리오 형식 기반: 화이트 배경 + 블루(#3B82F6) 섹션 타이틀
 * [문제] → [해결] → [결과] 카드 패턴
 * 편집 모드: 클릭 시 해당 위치에서 바로 인라인 편집
 */
import React, { useState, useRef, useEffect } from 'react';
import type { PortfolioDraftContent, AchievementCard as AchievementCardType } from '../../types/portfolio';

interface Props {
  content: PortfolioDraftContent;
  editMode?: boolean;
  onContentChange?: (updated: PortfolioDraftContent) => void;
}

/* ── 섹션 타이틀 ── */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-2xl font-bold text-blue-500 mt-10 mb-4">{children}</h2>
);

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-base font-bold text-gray-800 mt-4 mb-1">{children}</h3>
);

/* ── 인라인 편집 텍스트 ── */
const EditableText: React.FC<{
  value: string;
  editMode?: boolean;
  onChange: (val: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}> = ({ value, editMode, onChange, className = '', multiline = false, placeholder }) => {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => { setLocalVal(value); }, [value]);
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (!editMode) {
    return <span className={className}>{value}</span>;
  }

  if (editing) {
    const save = () => { onChange(localVal); setEditing(false); };
    const cancel = () => { setLocalVal(value); setEditing(false); };

    if (multiline) {
      return (
        <div className="relative">
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
            className="w-full p-2 text-sm border-2 border-blue-400 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 leading-relaxed"
            rows={Math.max(3, localVal.split('\n').length + 1)}
            placeholder={placeholder}
          />
          <div className="flex gap-1.5 mt-1.5">
            <button onClick={save} className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium">저장</button>
            <button onClick={cancel} className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 font-medium">취소</button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative inline-flex items-center gap-1.5">
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          onBlur={save}
          className={`border-2 border-blue-400 rounded-md px-2 py-0.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <span
      className={`${className} cursor-pointer rounded px-0.5 -mx-0.5 transition-colors hover:bg-blue-50 border border-transparent hover:border-blue-200`}
      onClick={() => setEditing(true)}
      title="클릭하여 편집"
    >
      {value || <span className="text-gray-300 italic">{placeholder || '클릭하여 입력'}</span>}
    </span>
  );
};

/* ── 성과 카드 (인라인 편집 가능) ── */
const AchievementCard: React.FC<{
  card: AchievementCardType;
  editMode?: boolean;
  onChange?: (updated: AchievementCardType) => void;
  onDelete?: () => void;
}> = ({ card, editMode, onChange, onDelete }) => {
  const update = (field: keyof AchievementCardType, val: string) => {
    onChange?.({ ...card, [field]: val });
  };

  return (
    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-3 relative group">
      {editMode && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-400 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
        >
          ×
        </button>
      )}
      <p className="font-bold text-sm text-gray-900 mb-2">
        <EditableText value={card.title} editMode={editMode} onChange={(v) => update('title', v)} placeholder="성과 제목" />
      </p>
      <p className="text-xs text-gray-700 mb-1">
        <span className="font-bold text-gray-800">[문제 상황] </span>
        <EditableText value={card.problem} editMode={editMode} onChange={(v) => update('problem', v)} multiline placeholder="문제 상황 설명" />
      </p>
      <p className="text-xs text-gray-700 mb-1">
        <span className="font-bold text-gray-800">[문제 해결] </span>
        <EditableText value={card.solution} editMode={editMode} onChange={(v) => update('solution', v)} multiline placeholder="해결 방법" />
      </p>
      <p className="text-xs text-gray-700">
        <span className="font-bold text-gray-800">[결과] </span>
        <EditableText value={card.result} editMode={editMode} onChange={(v) => update('result', v)} multiline placeholder="결과/성과" />
      </p>
    </div>
  );
};

/* ── 카드 추가 버튼 ── */
const AddCardButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-lg text-xs text-gray-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1"
  >
    + 성과 카드 추가
  </button>
);

const BulletRow: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex items-start gap-2 ${className}`}>
    <span className="mt-[7px] h-1 w-1 rounded-full bg-gray-500 flex-shrink-0" />
    <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
  </div>
);

const normalizeUrl = (url?: string) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

const translateEducationStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '졸업예정',
    expected: '졸업예정',
    attending: '재학',
    '재학 중': '재학',
    enrolled: '재학',
    graduated: '졸업',
    leave: '휴학',
    absence: '휴학',
  };

  const normalizedStatus = status.replace(/[()]/g, '').trim().toLowerCase();
  return statusMap[normalizedStatus] || statusMap[status] || status || '상태 미입력';
};

const translateCareerType = (type: string) => {
  const typeMap: Record<string, string> = {
    intern: '인턴',
    internship: '인턴',
    career: '경력',
    fulltime: '경력',
    contract: '계약직',
  };

  const normalizedType = type.replace(/[()]/g, '').trim().toLowerCase();
  return typeMap[normalizedType] || typeMap[type] || type || '유형 미입력';
};

const EditableStatus: React.FC<{
  value: string;
  editMode?: boolean;
  onChange: (val: string) => void;
}> = ({ value, editMode, onChange }) => {
  if (!editMode) return <>{translateEducationStatus(value)}</>;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-blue-300 rounded-md px-2 py-0.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
    >
      <option value="pending">졸업예정</option>
      <option value="graduated">졸업</option>
      <option value="attending">재학</option>
      <option value="leave">휴학</option>
    </select>
  );
};

const EditableCareerType: React.FC<{
  value: string;
  editMode?: boolean;
  onChange: (val: string) => void;
}> = ({ value, editMode, onChange }) => {
  if (!editMode) return <>{translateCareerType(value)}</>;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-blue-300 rounded-md px-2 py-0.5 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
    >
      <option value="intern">인턴</option>
      <option value="career">경력</option>
      <option value="contract">계약직</option>
    </select>
  );
};

/* ── 메인 템플릿 ── */
export const PortfolioTemplate: React.FC<Props> = ({ content, editMode = false, onContentChange }) => {

  // 헬퍼: content 업데이트
  const update = (partial: Partial<PortfolioDraftContent>) => {
    onContentChange?.({ ...content, ...partial });
  };

  const updateIntro = (index: number, field: 'title' | 'content', val: string) => {
    const updated = [...content.introductions];
    updated[index] = { ...updated[index], [field]: val };
    update({ introductions: updated });
  };

  const updateCareerAchievement = (careerIdx: number, achIdx: number, card: AchievementCardType) => {
    const updated = [...content.careers];
    const achs = [...updated[careerIdx].achievements];
    achs[achIdx] = card;
    updated[careerIdx] = { ...updated[careerIdx], achievements: achs };
    update({ careers: updated });
  };

  const addCareerAchievement = (careerIdx: number) => {
    const updated = [...content.careers];
    updated[careerIdx] = {
      ...updated[careerIdx],
      achievements: [...updated[careerIdx].achievements, { title: '새 성과', problem: '', solution: '', result: '' }],
    };
    update({ careers: updated });
  };

  const deleteCareerAchievement = (careerIdx: number, achIdx: number) => {
    const updated = [...content.careers];
    updated[careerIdx] = {
      ...updated[careerIdx],
      achievements: updated[careerIdx].achievements.filter((_, i) => i !== achIdx),
    };
    update({ careers: updated });
  };

  const updateProjectAchievement = (projIdx: number, achIdx: number, card: AchievementCardType) => {
    const updated = [...content.projects];
    const achs = [...updated[projIdx].achievements];
    achs[achIdx] = card;
    updated[projIdx] = { ...updated[projIdx], achievements: achs };
    update({ projects: updated });
  };

  const addProjectAchievement = (projIdx: number) => {
    const updated = [...content.projects];
    updated[projIdx] = {
      ...updated[projIdx],
      achievements: [...updated[projIdx].achievements, { title: '새 성과', problem: '', solution: '', result: '' }],
    };
    update({ projects: updated });
  };

  const deleteProjectAchievement = (projIdx: number, achIdx: number) => {
    const updated = [...content.projects];
    updated[projIdx] = {
      ...updated[projIdx],
      achievements: updated[projIdx].achievements.filter((_, i) => i !== achIdx),
    };
    update({ projects: updated });
  };

  const updateActivityBullet = (actIdx: number, bulletIdx: number, val: string) => {
    const updated = [...content.activities];
    const bullets = [...updated[actIdx].bullets];
    bullets[bulletIdx] = val;
    updated[actIdx] = { ...updated[actIdx], bullets };
    update({ activities: updated });
  };

  const updateSkill = (skillIdx: number, val: string) => {
    const updated = [...content.skills];
    updated[skillIdx] = val;
    update({ skills: updated });
  };

  const addSkill = () => {
    update({ skills: [...content.skills, '새 스킬'] });
  };

  const deleteSkill = (skillIdx: number) => {
    update({ skills: content.skills.filter((_, i) => i !== skillIdx) });
  };

  const updateProjectTechStack = (projIdx: number, techIdx: number, val: string) => {
    const updated = [...content.projects];
    const techStack = [...updated[projIdx].techStack];
    techStack[techIdx] = val;
    updated[projIdx] = { ...updated[projIdx], techStack };
    update({ projects: updated });
  };

  const addProjectTechStack = (projIdx: number) => {
    const updated = [...content.projects];
    updated[projIdx] = {
      ...updated[projIdx],
      techStack: [...updated[projIdx].techStack, '새 기술'],
    };
    update({ projects: updated });
  };

  const deleteProjectTechStack = (projIdx: number, techIdx: number) => {
    const updated = [...content.projects];
    updated[projIdx] = {
      ...updated[projIdx],
      techStack: updated[projIdx].techStack.filter((_, i) => i !== techIdx),
    };
    update({ projects: updated });
  };

  return (
    <div
      id="portfolio-template"
      data-pdf-root
      className="bg-white text-gray-900 mx-auto shadow-2xl flex-shrink-0"
      style={{
        fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif",
        width: '210mm',
        maxWidth: '210mm',
      }}
    >
      {/* ==================== PAGE 1 ==================== */}
      <div className="px-10 pt-10 pb-6" data-pdf-section>
        {/* Header */}
        <header className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-extrabold text-gray-900">
                <EditableText value={content.name} editMode={editMode} onChange={(v) => update({ name: v })} placeholder="이름" />
              </span>
              <span className="text-xl font-light text-gray-500">
                <EditableText value={content.englishName} editMode={editMode} onChange={(v) => update({ englishName: v })} placeholder="English Name" />
              </span>
              <span className="text-sm font-medium text-gray-400">
                <EditableText value={content.targetRole} editMode={editMode} onChange={(v) => update({ targetRole: v })} placeholder="희망 직무" />
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-0.5">
              <p>
                <span className="text-gray-400 mr-1">생년월일 |</span>
                <EditableText value={content.birthDate} editMode={editMode} onChange={(v) => update({ birthDate: v })} />
                <span className="text-gray-400 ml-4 mr-1">연락처 |</span>
                <EditableText value={content.phone} editMode={editMode} onChange={(v) => update({ phone: v })} />
              </p>
              <p>
                <span className="text-gray-400 mr-1">이메일 |</span>
                <EditableText value={content.email} editMode={editMode} onChange={(v) => update({ email: v })} />
                <span className="text-gray-400 ml-4 mr-1">GitHub |</span>
                {editMode ? (
                  <span className="text-blue-500 underline">
                    <EditableText value={content.github} editMode={editMode} onChange={(v) => update({ github: v })} />
                  </span>
                ) : content.github ? (
                  <a href={normalizeUrl(content.github)} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                    {content.github}
                  </a>
                ) : (
                  <span className="text-gray-300">-</span>
                )}
              </p>
            </div>
          </div>
          <div className="w-24 h-28 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-gray-200 flex-shrink-0">
            프로필 사진
          </div>
        </header>

        <hr className="border-gray-200 mb-2" />

        {/* Introduction */}
        <SectionTitle>Introduction</SectionTitle>
        {content.introductions.map((intro, i) => (
          <div key={i} className="mb-4">
            <p className="font-bold text-sm text-gray-900 mb-1">
              <EditableText value={intro.title} editMode={editMode} onChange={(v) => updateIntro(i, 'title', v)} placeholder="소개 제목" />
            </p>
            <div className="text-sm text-gray-700 leading-relaxed">
              <EditableText value={intro.content} editMode={editMode} onChange={(v) => updateIntro(i, 'content', v)} multiline placeholder="소개 내용" />
            </div>
          </div>
        ))}

        {/* Skills — flat array */}
        <SectionTitle>Skills</SectionTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {content.skills.map((skill, j) => (
            <span key={j} className="group relative inline-flex h-7 items-center justify-center px-3 text-xs leading-none font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-md whitespace-nowrap">
              {editMode ? (
                <EditableText
                  value={skill}
                  editMode={editMode}
                  onChange={(v) => updateSkill(j, v)}
                  className="text-xs leading-none font-medium"
                  placeholder="스킬"
                />
              ) : (
                <span className="relative -top-px leading-none">{skill}</span>
              )}
              {editMode && (
                <button
                  onClick={() => deleteSkill(j)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                  aria-label="스킬 삭제"
                >
                  x
                </button>
              )}
            </span>
          ))}
          {editMode && (
            <button
              onClick={addSkill}
              className="inline-flex h-7 items-center justify-center px-3 text-xs leading-none font-medium text-blue-500 border border-dashed border-blue-200 rounded-md hover:bg-blue-50 whitespace-nowrap"
            >
              + Skill 추가
            </button>
          )}
        </div>

        {/* Career */}
        <SectionTitle>Career</SectionTitle>
        {content.careers.map((career, ci) => (
          <div key={ci} className="mb-6">
            <div className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mt-[7px] flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base font-bold text-gray-900">
                    <EditableText value={career.companyName} editMode={editMode} onChange={(v) => {
                      const c = [...content.careers]; c[ci] = { ...c[ci], companyName: v }; update({ careers: c });
                    }} />
                  </span>
                  <span className="text-sm text-gray-500">
                    |{' '}
                    <EditableText value={career.period} editMode={editMode} onChange={(v) => {
                      const c = [...content.careers]; c[ci] = { ...c[ci], period: v }; update({ careers: c });
                    }} className="text-sm text-gray-500" placeholder="근무 기간" />
                    {' '}(
                    <EditableCareerType value={career.type} editMode={editMode} onChange={(v) => {
                      const c = [...content.careers]; c[ci] = { ...c[ci], type: v }; update({ careers: c });
                    }} />
                    )
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  <EditableText value={career.description} editMode={editMode} onChange={(v) => {
                    const c = [...content.careers]; c[ci] = { ...c[ci], description: v }; update({ careers: c });
                  }} multiline placeholder="경력 설명" />
                </p>
                {career.position && (
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="font-bold">직무:</span>{' '}
                      <EditableText value={career.position} editMode={editMode} onChange={(v) => {
                        const c = [...content.careers]; c[ci] = { ...c[ci], position: v }; update({ careers: c });
                      }} className="text-sm" placeholder="직무" />
                    </p>
                  </div>
                )}
                <div className="mt-3">
                  {career.achievements.map((card, ai) => (
                    <AchievementCard
                      key={ai}
                      card={card}
                      editMode={editMode}
                      onChange={(c) => updateCareerAchievement(ci, ai, c)}
                      onDelete={() => deleteCareerAchievement(ci, ai)}
                    />
                  ))}
                  {editMode && <AddCardButton onClick={() => addCareerAchievement(ci)} />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== PROJECTS ==================== */}
      {content.projects.map((project, pi) => (
        <div key={pi} className="px-10 py-6 border-t border-gray-100" data-pdf-section>
          {pi === 0 && <SectionTitle>Project</SectionTitle>}

          <div className="flex gap-6">
            {/* Left column */}
            <div className="w-[35%] flex-shrink-0">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-[8px] flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    <EditableText value={project.projectName} editMode={editMode} onChange={(v) => {
                      const p = [...content.projects]; p[pi] = { ...p[pi], projectName: v }; update({ projects: p });
                    }} />
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    |{' '}
                    <EditableText value={project.period} editMode={editMode} onChange={(v) => {
                      const p = [...content.projects]; p[pi] = { ...p[pi], period: v }; update({ projects: p });
                    }} className="text-xs text-gray-500" placeholder="프로젝트 기간" />
                  </p>
                </div>
              </div>

              <p className="font-bold text-sm text-gray-900 mt-3">
                <EditableText value={project.subtitle} editMode={editMode} onChange={(v) => {
                  const p = [...content.projects]; p[pi] = { ...p[pi], subtitle: v }; update({ projects: p });
                }} placeholder="프로젝트 한 줄 소개" />
              </p>
              <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                <EditableText value={project.description} editMode={editMode} onChange={(v) => {
                  const p = [...content.projects]; p[pi] = { ...p[pi], description: v }; update({ projects: p });
                }} multiline placeholder="프로젝트 개요" />
              </div>

              <p className="font-bold text-sm text-gray-900 mt-4">기술 스택</p>
              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                {project.techStack.map((tech, j) => (
                  <BulletRow key={j}>
                    <EditableText
                      value={tech}
                      editMode={editMode}
                      onChange={(v) => updateProjectTechStack(pi, j, v)}
                      className="text-xs"
                      placeholder="기술 스택"
                    />
                    {editMode && (
                      <button
                        onClick={() => deleteProjectTechStack(pi, j)}
                        className="ml-1 text-gray-400 hover:text-red-500"
                        aria-label="기술 스택 삭제"
                      >
                        x
                      </button>
                    )}
                  </BulletRow>
                ))}
              </div>
              {editMode && (
                <button
                  onClick={() => addProjectTechStack(pi)}
                  className="mt-2 text-xs text-blue-500 hover:underline"
                >
                  + 기술 스택 추가
                </button>
              )}

              <p className="font-bold text-sm text-gray-900 mt-4">팀 구성</p>
              <p className="text-xs text-gray-600 mt-1">
                <EditableText value={project.teamSize} editMode={editMode} onChange={(v) => {
                  const p = [...content.projects]; p[pi] = { ...p[pi], teamSize: v }; update({ projects: p });
                }} />
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                {(project.links.github || editMode) && (
                  editMode ? (
                    <div className="text-xs text-gray-600">
                      <span className="font-bold mr-1">GitHub:</span>
                      <EditableText value={project.links.github || ''} editMode={editMode} onChange={(v) => {
                        const p = [...content.projects]; p[pi] = { ...p[pi], links: { ...p[pi].links, github: v } }; update({ projects: p });
                      }} className="text-xs" placeholder="GitHub URL" />
                    </div>
                  ) : (
                    <a
                      href={normalizeUrl(project.links.github)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs h-7 px-3 leading-none border border-gray-300 rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                      <span className="relative -top-px leading-none">GitHub</span>
                    </a>
                  )
                )}
                {(project.links.demo || editMode) && (
                  editMode ? (
                    <div className="text-xs text-gray-600">
                      <span className="font-bold mr-1">Demo:</span>
                      <EditableText value={project.links.demo || ''} editMode={editMode} onChange={(v) => {
                        const p = [...content.projects]; p[pi] = { ...p[pi], links: { ...p[pi].links, demo: v } }; update({ projects: p });
                      }} className="text-xs" placeholder="Demo URL" />
                    </div>
                  ) : (
                    <a
                      href={normalizeUrl(project.links.demo)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs h-7 px-3 leading-none border border-gray-300 rounded-full text-gray-600 hover:text-blue-600 hover:border-blue-300 inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <span className="relative -top-px leading-none">Demo</span>
                    </a>
                  )
                )}
              </div>
            </div>

            {/* Right column — Achievement cards */}
            <div className="flex-1 space-y-3">
              {project.achievements.map((card, ai) => (
                <AchievementCard
                  key={ai}
                  card={card}
                  editMode={editMode}
                  onChange={(c) => updateProjectAchievement(pi, ai, c)}
                  onDelete={() => deleteProjectAchievement(pi, ai)}
                />
              ))}
              {editMode && <AddCardButton onClick={() => addProjectAchievement(pi)} />}
            </div>
          </div>
        </div>
      ))}

      {/* ==================== LAST SECTION ==================== */}
      <div className="px-10 py-6 border-t border-gray-100" data-pdf-section>
        {/* Education */}
        <SectionTitle>Education</SectionTitle>
        {content.education && content.education.school && (
          <>
            <p className="text-sm">
              <span className="font-bold">
                <EditableText value={content.education.school} editMode={editMode} onChange={(v) => {
                  update({ education: { ...content.education, school: v } });
                }} placeholder="학교명" />
                {' '}
                <EditableText value={content.education.major} editMode={editMode} onChange={(v) => {
                  update({ education: { ...content.education, major: v } });
                }} placeholder="전공" />
              </span>
              <span className="text-gray-500 ml-2">
                |{' '}
                <EditableText value={content.education.period} editMode={editMode} onChange={(v) => {
                  update({ education: { ...content.education, period: v } });
                }} className="text-gray-500" placeholder="교육 기간" />
                {' '}(
                <EditableStatus value={content.education.status} editMode={editMode} onChange={(v) => {
                  update({ education: { ...content.education, status: v } });
                }} />
                )
              </span>
            </p>
            {content.education.gpa && (
              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                <BulletRow>
                  평균 학점:{' '}
                  <EditableText value={content.education.gpa} editMode={editMode} onChange={(v) => {
                    update({ education: { ...content.education, gpa: v } });
                  }} className="text-xs" placeholder="학점" />
                  {' / '}
                  <EditableText value={content.education.maxGpa} editMode={editMode} onChange={(v) => {
                    update({ education: { ...content.education, maxGpa: v } });
                  }} className="text-xs" placeholder="만점" />
                </BulletRow>
              </div>
            )}
          </>
        )}

        {/* Language */}
        {content.languages.length > 0 && (
          <>
            <SectionTitle>Language</SectionTitle>
            {content.languages.map((lang, i) => (
              <p key={i} className="text-sm">
                <span className="font-bold">
                  <EditableText value={lang.name} editMode={editMode} onChange={(v) => {
                    const languages = [...content.languages]; languages[i] = { ...languages[i], name: v }; update({ languages });
                  }} placeholder="어학 시험명" />
                </span>
                <span className="text-gray-500 ml-2">
                  |{' '}
                  <EditableText value={lang.score} editMode={editMode} onChange={(v) => {
                    const languages = [...content.languages]; languages[i] = { ...languages[i], score: v }; update({ languages });
                  }} className="text-gray-500" placeholder="점수/등급" />
                  {' | '}
                  <EditableText value={lang.date} editMode={editMode} onChange={(v) => {
                    const languages = [...content.languages]; languages[i] = { ...languages[i], date: v }; update({ languages });
                  }} className="text-gray-500" placeholder="취득일" />
                </span>
              </p>
            ))}
          </>
        )}

        {/* Activities */}
        {content.activities.length > 0 && (
          <>
            <SectionTitle>Activity</SectionTitle>
            {content.activities.map((activity, ai) => (
              <div key={ai} className="mb-4">
                <p className="text-sm font-bold text-gray-900">
                  <EditableText value={activity.name} editMode={editMode} onChange={(v) => {
                    const activities = [...content.activities]; activities[ai] = { ...activities[ai], name: v }; update({ activities });
                  }} placeholder="활동명" />
                  <span className="font-normal text-gray-500 ml-2">
                    |{' '}
                    <EditableText value={activity.period} editMode={editMode} onChange={(v) => {
                      const activities = [...content.activities]; activities[ai] = { ...activities[ai], period: v }; update({ activities });
                    }} className="text-xs text-gray-500" placeholder="활동 기간" />
                  </span>
                </p>
                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                  {activity.bullets.map((bullet, bi) => (
                    <BulletRow key={bi}>
                      <EditableText
                        value={bullet}
                        editMode={editMode}
                        onChange={(v) => updateActivityBullet(ai, bi, v)}
                        className="text-xs"
                        placeholder="활동 내용"
                      />
                    </BulletRow>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Awards */}
        {content.awards.length > 0 && (
          <>
            <SectionTitle>Awards</SectionTitle>
            {content.awards.map((award, i) => (
              <div key={i} className="mb-3">
                <p className="text-sm font-bold text-gray-900">
                  {award.name} ({award.organization})
                  <span className="font-normal text-gray-500 ml-2">| {award.date}</span>
                </p>
                {award.description && (
                  <div className="text-xs text-gray-600 mt-1">
                    <BulletRow>{award.description}</BulletRow>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Certificate */}
        {content.certificates.length > 0 && (
          <>
            <SectionTitle>Certificate</SectionTitle>
            {content.certificates.map((cert, i) => (
              <p key={i} className="text-sm mb-1">
                <span className="font-bold">
                  <EditableText value={cert.name} editMode={editMode} onChange={(v) => {
                    const certificates = [...content.certificates]; certificates[i] = { ...certificates[i], name: v }; update({ certificates });
                  }} placeholder="자격증명" />
                </span>
                <span className="text-gray-500 ml-2">
                  |{' '}
                  <EditableText value={cert.date} editMode={editMode} onChange={(v) => {
                    const certificates = [...content.certificates]; certificates[i] = { ...certificates[i], date: v }; update({ certificates });
                  }} className="text-gray-500" placeholder="취득일" />
                </span>
              </p>
            ))}
          </>
        )}

        <div className="h-12" />
      </div>
    </div>
  );
};
