/**
 * PortfolioDraftPage — 포트폴리오 초안 작성 메인 페이지
 * 좌측 사이드바(컨트롤) + 중앙 템플릿 프리뷰 (인라인 편집)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioTemplate } from './PortfolioTemplate';
import { portfolioDraftApi } from '../../api/portfolioDraftApi';
import type { PortfolioDraftResponse, PortfolioDraftContent } from '../../types/portfolio';

export const PortfolioDraftPage: React.FC = () => {
  const [draft, setDraft] = useState<PortfolioDraftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // 저장된 초안 불러오기
  useEffect(() => {
    portfolioDraftApi.getLatest()
      .then((res) => {
        setDraft(res);
        setLoading(false);
      })
      .catch(() => {
        // 초안이 없는 경우 (404)
        setDraft(null);
        setLoading(false);
      });
  }, []);

  // AI 초안 생성
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const newDraft = await portfolioDraftApi.generate();
      setDraft(newDraft);
      setSaved(true);
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'AI 초안 생성에 실패했습니다.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }, []);

  // 인라인 편집 시 content 업데이트 (로컬 상태만)
  const handleContentChange = useCallback((updatedContent: PortfolioDraftContent) => {
    if (!draft) return;
    setDraft({
      ...draft,
      content: updatedContent,
      status: 'EDITED',
      updatedAt: new Date().toISOString(),
    });
    setSaved(false);
  }, [draft]);

  // 저장 (서버에 PATCH)
  const handleSave = useCallback(async () => {
    if (!draft) return;
    setError(null);
    try {
      const updated = await portfolioDraftApi.update(draft.id, draft.content);
      setDraft(updated);
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || '저장에 실패했습니다.');
    }
  }, [draft]);

  // PDF 다운로드
  const handleDownloadPDF = useCallback(async () => {
    if (downloading) return;

    setDownloading(true);
    setError(null);
    setEditMode(false);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const element = document.getElementById('portfolio-template');
    if (!element) {
      setError('PDF로 변환할 포트폴리오 영역을 찾지 못했습니다.');
      setDownloading(false);
      return;
    }

    let pdfRoot: HTMLElement | null = null;

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      let cursorY = 0;
      let hasContentOnPage = false;

      pdfRoot = element.cloneNode(true) as HTMLElement;
      pdfRoot.removeAttribute('id');
      pdfRoot.style.position = 'fixed';
      pdfRoot.style.left = '-10000px';
      pdfRoot.style.top = '0';
      pdfRoot.style.width = '210mm';
      pdfRoot.style.maxWidth = '210mm';
      pdfRoot.style.boxShadow = 'none';
      pdfRoot.style.transform = 'none';
      document.body.appendChild(pdfRoot);

      await document.fonts?.ready;

      const sections = Array.from(pdfRoot.querySelectorAll<HTMLElement>('[data-pdf-section]'));
      const pdfSections = sections.length > 0 ? sections : [pdfRoot];

      const addPageIfNeeded = () => {
        if (hasContentOnPage) {
          pdf.addPage();
        }
        cursorY = 0;
        hasContentOnPage = false;
      };

      const addCanvasToPdf = (canvas: HTMLCanvasElement, y: number, height: number) => {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, y, pageWidth, height, undefined, 'FAST');
      };

      const addLinkAnnotations = (
        section: HTMLElement,
        pageY: number,
        sectionPdfHeight: number,
        slice?: { startRatio: number; endRatio: number },
      ) => {
        const sectionRect = section.getBoundingClientRect();
        if (sectionRect.width <= 0 || sectionRect.height <= 0) return;

        const scaleX = pageWidth / sectionRect.width;
        const scaleY = sectionPdfHeight / sectionRect.height;

        section.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
          const href = anchor.href;
          if (!href) return;

          const rect = anchor.getBoundingClientRect();
          const anchorTop = rect.top - sectionRect.top;
          const anchorBottom = rect.bottom - sectionRect.top;
          const sliceStart = slice ? slice.startRatio * sectionRect.height : 0;
          const sliceEnd = slice ? slice.endRatio * sectionRect.height : sectionRect.height;
          const overlapTop = Math.max(anchorTop, sliceStart);
          const overlapBottom = Math.min(anchorBottom, sliceEnd);

          if (overlapBottom <= overlapTop) return;

          pdf.link(
            (rect.left - sectionRect.left) * scaleX,
            pageY + (overlapTop - sliceStart) * scaleY,
            rect.width * scaleX,
            (overlapBottom - overlapTop) * scaleY,
            { url: href },
          );
        });
      };

      for (const section of pdfSections) {
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: pdfRoot.scrollWidth,
        });

        const sectionHeight = (canvas.height * pageWidth) / canvas.width;

        if (sectionHeight <= pageHeight) {
          if (cursorY > 0 && cursorY + sectionHeight > pageHeight) {
            addPageIfNeeded();
          }

          addCanvasToPdf(canvas, cursorY, sectionHeight);
          addLinkAnnotations(section, cursorY, sectionHeight);
          cursorY += sectionHeight;
          hasContentOnPage = true;
          continue;
        }

        if (cursorY > 0) {
          addPageIfNeeded();
        }

        const pagePixelHeight = Math.floor((canvas.width * pageHeight) / pageWidth);
        let sourceY = 0;

        while (sourceY < canvas.height) {
          const sliceHeight = Math.min(pagePixelHeight, canvas.height - sourceY);
          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceHeight;

          const context = sliceCanvas.getContext('2d');
          if (!context) throw new Error('PDF canvas context 생성 실패');

          context.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight,
          );

          const slicePdfHeight = (sliceHeight * pageWidth) / canvas.width;
          addCanvasToPdf(sliceCanvas, 0, slicePdfHeight);
          addLinkAnnotations(section, 0, sectionHeight, {
            startRatio: sourceY / canvas.height,
            endRatio: (sourceY + sliceHeight) / canvas.height,
          });
          hasContentOnPage = true;
          sourceY += sliceHeight;

          if (sourceY < canvas.height) {
            addPageIfNeeded();
          }
        }

        cursorY = pageHeight;
      }

      pdf.save('포트폴리오.pdf');
    } catch (err) {
      console.error('PDF 생성 실패:', err);
      setError('PDF 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      pdfRoot?.remove();
      setDownloading(false);
    }
  }, [downloading]);

  // 초안 삭제
  const handleDelete = useCallback(async () => {
    if (!draft) return;
    if (!confirm('초안을 삭제하시겠습니까?')) return;
    setError(null);
    try {
      await portfolioDraftApi.delete(draft.id);
      setDraft(null);
      setEditMode(false);
    } catch (e: any) {
      setError(e?.message || '삭제에 실패했습니다.');
    }
  }, [draft]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Empty State
  if (!draft && !generating) {
    return (
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">포트폴리오 초안 작성</h2>
          <p className="text-gray-500 mb-2 max-w-md mx-auto leading-relaxed">
            입력하신 정보(학력, 프로젝트, 활동, 경력, 자격증)를 기반으로<br/>
            AI가 포트폴리오 초안을 자동으로 작성합니다.
          </p>
          <p className="text-xs text-gray-400 mb-8">생성된 초안은 자유롭게 편집하고 PDF로 다운로드할 수 있습니다.</p>

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            AI 포트폴리오 초안 생성하기
          </button>
          <div className="mt-12 grid grid-cols-3 gap-4 text-left">
            {[
              { icon: '📝', title: '자기소개', desc: 'AI가 경험을 종합하여 3개 문단으로 작성' },
              { icon: '💡', title: '프로젝트 성과', desc: '[문제→해결→결과] 패턴으로 정리' },
              { icon: '📄', title: 'PDF 다운로드', desc: '완성된 포트폴리오를 PDF로 저장' },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <p className="font-bold text-sm text-gray-800 mt-2">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generating State
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-2xl bg-blue-100 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">AI가 포트폴리오를 작성하고 있습니다</h3>
        <p className="text-sm text-gray-500">입력하신 정보를 분석하여 각 섹션을 생성 중...</p>
        <div className="flex items-center gap-2 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  // Main View: 사이드바 + 템플릿 (인라인 편집)
  return (
    <div className="max-w-7xl mx-auto px-4 flex gap-6">
      {/* Left Sidebar */}
      <div className="w-56 flex-shrink-0 sticky top-24 self-start">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-sm text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            포트폴리오 초안
          </h3>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-2">
            {/* 편집 모드 토글 */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                editMode
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ✏️ {editMode ? '편집 모드 ON' : '편집 모드 OFF'}
            </button>

            {/* 저장 */}
            {!saved && (
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors animate-pulse"
              >
                💾 저장하기
              </button>
            )}

            <hr className="!my-3 border-gray-100" />

            {/* AI 재생성 */}
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-blue-200 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              ✨ AI 재생성
            </button>

            {/* PDF 다운로드 */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-wait text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {downloading ? 'PDF 생성 중...' : '📥 PDF 다운로드'}
            </button>
          </div>

          <hr className="my-4 border-gray-100" />

          {/* 상태 */}
          <div className="text-xs text-gray-400 space-y-1.5">
            <p className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${saved ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
              {saved ? '저장됨' : '수정 사항 있음'}
            </p>
            {draft && (
              <p className="text-gray-400">
                상태: <span className="font-medium text-gray-500">{draft.status}</span>
              </p>
            )}
            {editMode && (
              <p className="text-blue-500 font-medium">
                💡 텍스트를 클릭하면 바로 수정됩니다
              </p>
            )}
          </div>

          <hr className="my-4 border-gray-100" />

          <button onClick={handleDelete} className="w-full text-xs text-red-400 hover:text-red-600 py-1.5 transition-colors">
            🗑 초안 삭제
          </button>
        </div>
      </div>

      {/* Center — Template Preview (Inline Editing) */}
      <div className="flex-1 min-w-0">
        {editMode && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-sm text-blue-700">
            <span className="text-lg">✏️</span>
            <span className="font-medium">편집 모드</span>
            <span className="text-blue-500">— 텍스트를 클릭하면 바로 수정할 수 있습니다. 성과 카드는 추가/삭제가 가능합니다.</span>
          </div>
        )}
        <div
          className="bg-gray-50 rounded-2xl p-6 overflow-x-auto"
          style={{
            backgroundImage: editMode ? 'radial-gradient(circle, #dbeafe 1px, transparent 1px)' : 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <PortfolioTemplate
            content={draft!.content}
            editMode={editMode}
            onContentChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  );
};
