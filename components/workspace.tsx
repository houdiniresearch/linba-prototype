'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowUpRightIcon, ArrowRightIcon, BookOpenIcon, BroadcastIcon, ChartBarIcon,
  CheckIcon, CheckCircleIcon, ChatsCircleIcon, CaretRightIcon,
  ClipboardTextIcon, CopyIcon, FileTextIcon, LightningIcon, PaperPlaneTiltIcon,
  PlusIcon, SparkleIcon, UsersThreeIcon, XIcon,
} from '@phosphor-icons/react';
import { initialTopics, STORAGE_KEY, type Topic } from './demo-data';

function useTopics() {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const current = useRef<Topic[]>(initialTopics);
  useEffect(() => {
    const restore = (stored: string) => {
      try { const parsed: Topic[] = JSON.parse(stored); if (Array.isArray(parsed) && parsed.length) { current.current = parsed; setTopics(parsed); } } catch { /* retain demo on invalid storage */ }
    };
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) restore(stored); } catch { /* storage unavailable */ }
    const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY && event.newValue) restore(event.newValue); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const saveTopics = useCallback((action: React.SetStateAction<Topic[]>) => {
    const next = typeof action === 'function' ? action(current.current) : action;
    current.current = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* keep current-tab interaction working */ }
    setTopics(next);
  }, []);
  return [topics, saveTopics] as const;
}

function Wordmark({ inverse = false }: { inverse?: boolean }) {
  return <span className={`wordmark ${inverse ? 'inverse' : ''}`}>linba<span className="logo-dot" /></span>;
}
function PreviewLabel() { return <span className="preview-label">Tasarım önizlemesi <span>·</span> Örnek eğitim</span>; }
const screens = [
  { id: 'prep', label: 'Hazırlık', description: 'Materyaller ve prova', icon: BookOpenIcon },
  { id: 'live', label: 'Canlı oturum', description: 'Sorular ve etkileşim', icon: BroadcastIcon },
  { id: 'report', label: 'Eğitim sonrası', description: 'Rapor ve devam eden destek', icon: ChartBarIcon },
] as const;
type Screen = typeof screens[number]['id'];

export function Workspace() {
  const [topics, setTopics] = useTopics();
  const [screen, setScreen] = useState<Screen>('live');
  const [selected, setSelected] = useState('audience');
  const [tab, setTab] = useState<'answer' | 'questions'>('answer');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [filter, setFilter] = useState<'all' | 'waiting'>('all');
  const [activity, setActivity] = useState(false);
  useEffect(() => { setJoinUrl(`${window.location.origin}/katil`); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer); }, [toast]);
  const topic = topics.find(item => item.id === selected) ?? topics[0];
  const total = topics.reduce((sum, item) => sum + item.questions.length, 0);
  const waiting = topics.filter(item => !item.resolved);
  const notify = (message: string) => setToast(message);
  const update = (patch: Partial<Topic>) => setTopics(items => items.map(item => item.id === topic.id ? { ...item, ...patch } : item));
  const copyLink = async () => { try { await navigator.clipboard.writeText(joinUrl); notify('Katılım bağlantısı kopyalandı.'); } catch { notify('Bağlantıyı adres alanından kopyalayabilirsin.'); } };

  return <div className="app-layout">
    <a className="skip-link" href="#main-content">İçeriğe geç</a>
    <aside className="sidebar">
      <div className="sidebar-brand"><Wordmark inverse /><span className="brand-caption">Eğitim çalışma alanı</span></div>
      <div className="course-identity"><span className="course-type">ATÖLYE</span><h2>Dijital Pazarlama<br />Temelleri</h2><span className="course-meta">Örnek program · 1 oturum</span></div>
      <nav className="phase-nav" aria-label="Eğitimin aşamaları">{screens.map(({ id, label, description, icon: Icon }, index) => <button key={id} className={`phase-link ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)} aria-current={screen === id ? 'page' : undefined}><span className="phase-symbol"><Icon size={20} weight={screen === id ? 'fill' : 'regular'} /></span><span><strong>{label}</strong><small>{description}</small></span><span className="phase-number">0{index + 1}</span></button>)}</nav>
      <div className="sidebar-note"><span className="tiny-label">EĞİTMEN NOTU</span><p>Her soru, bir sonraki eğitimin başlangıcı.</p></div>
      <div className="sidebar-bottom"><a href="/katil" target="_blank" rel="noreferrer"><UsersThreeIcon size={18} />Katılımcı ekranı<ArrowUpRightIcon size={16} /></a><div className="profile"><span className="avatar">MA</span><span><strong>M. Abdulkadir Aslan</strong><small>Eğitmen</small></span></div></div>
    </aside>
    <main className="main-workspace" id="main-content">
      <header className="workspace-top"><div className="breadcrumb"><span>Çalışma alanım</span><CaretRightIcon size={12} /><span>Dijital Pazarlama Temelleri</span></div><PreviewLabel /></header>
      <section className="page-header"><div><div className="session-status"><span className="status-dot" />{screen === 'live' ? 'Örnek oturum açık' : screen === 'prep' ? 'Oturuma hazırlan' : 'Eğitimden sonra'}</div><h1>{screen === 'live' ? 'Katılımcıların sesine odaklan.' : screen === 'prep' ? 'İyi bir eğitim, hazırlıkla başlar.' : 'Bir sonraki eğitime taşı.'}</h1><p>{screen === 'live' ? 'Soruları bir araya getir. Kaynağıyla yanıtla. Konuyu birlikte aç.' : screen === 'prep' ? 'Materyallerini bir araya getir, hedef kitleni tanımla ve anlatımını sına.' : 'Bu oturumda sorulanları ve yeniden ele alınabilecek konuları gör.'}</p></div>
      <Dialog.Root><Dialog.Trigger asChild><button className="button dark invite-button"><PlusIcon size={18} />Katılımcıları davet et</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal"><Dialog.Title>Birlikte başlayın.</Dialog.Title><Dialog.Description>Katılımcılar bu taslağı aynı tarayıcıda açabilir. Bu aşamada eşleşme aynı cihazdaki sekmeler arasında çalışır.</Dialog.Description><div className="qr-wrap"><QRCodeSVG value={joinUrl || 'http://localhost:3000/katil'} size={170} /></div><span className="field-label">Örnek katılım kodu</span><div className="join-code">482 915</div><button className="button primary full" onClick={copyLink}><CopyIcon size={17} />Bağlantıyı kopyala</button><a className="participant-link" href="/katil" target="_blank" rel="noreferrer">Katılımcı ekranını aç<ArrowUpRightIcon size={16} /></a><Dialog.Close className="icon-button modal-close" aria-label="Davet penceresini kapat"><XIcon size={20} /></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>
      </section>
      {screen === 'live' ? <>
        <div className="session-toolbar"><div className="session-summary"><span><ChatsCircleIcon size={18} /><strong>{total}</strong> soru</span><span><ClipboardTextIcon size={18} /><strong>{topics.length}</strong> konu başlığı</span><span className="waiting-summary">{waiting.length} konu ele alınmayı bekliyor</span></div><span className="code-label">Katılım kodu <strong>482 915</strong></span></div>
        <div className="live-workspace">
          <section className="questions-pane" aria-labelledby="questions-title"><div className="pane-header"><h2 id="questions-title">Soru akışı</h2><span className="number-label">{topics.length.toString().padStart(2, '0')}</span></div><div className="filter-tabs" aria-label="Soru filtresi"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Tümü</button><button className={filter === 'waiting' ? 'selected' : ''} onClick={() => setFilter('waiting')}>Bekleyenler <span>{waiting.length}</span></button></div><div className="topic-list">{(filter === 'all' ? topics : waiting).map((item, index) => <button key={item.id} className={`topic-row ${topic.id === item.id ? 'selected' : ''}`} onClick={() => { setSelected(item.id); setTab('answer'); setSourceOpen(false); }} aria-pressed={topic.id === item.id}><span className="topic-order">{String(index + 1).padStart(2, '0')}</span><span className="topic-copy"><strong>{item.title}</strong><small>{item.questions.length} soru{item.shared ? ' · Yanıt paylaşıldı' : item.resolved ? ' · Ele alındı' : ' · Yanıt bekliyor'}</small></span><span className="topic-count">{item.resolved ? <CheckIcon size={16} /> : item.questions.length}</span><CaretRightIcon className="row-arrow" size={15} /></button>)}</div>{filter === 'waiting' && !waiting.length && <div className="empty-state"><CheckCircleIcon size={28} /><h3>Tüm konular ele alındı.</h3><p>Yeni sorular geldiğinde burada görünür.</p></div>}<div className="question-footnote"><SparkleIcon size={15} /><span>Gruplar bu taslakta örnek olarak hazırlanmıştır.</span></div></section>
          <section className="answer-pane" aria-labelledby="selected-title"><div className="answer-meta"><span>SEÇİLEN KONU</span><span>{topic.resolved ? 'Ele alındı' : 'Eğitmen incelemesinde'}</span></div><h2 id="selected-title">{topic.title}</h2><p className="topic-context">{topic.questions.length} soru aynı konuya işaret ediyor.</p><div className="answer-tabs" role="tablist" aria-label="Konu ayrıntıları"><button role="tab" id="answer-tab" aria-selected={tab === 'answer'} aria-controls="answer-panel" className={tab === 'answer' ? 'active' : ''} onClick={() => setTab('answer')}>Örnek yanıt</button><button role="tab" id="questions-tab" aria-selected={tab === 'questions'} aria-controls="answer-panel" className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>Katılımcı soruları <span>{topic.questions.length}</span></button></div><div className="answer-body" id="answer-panel" role="tabpanel" aria-labelledby={tab === 'answer' ? 'answer-tab' : 'questions-tab'}>{tab === 'answer' ? topic.answer ? <>{topic.answer.split('\n\n').map(text => <p key={text}>{text}</p>)}<button className="source-reference" onClick={() => setSourceOpen(!sourceOpen)} aria-expanded={sourceOpen}><span className="source-icon"><FileTextIcon size={20} /></span><span><small>YANITIN KAYNAĞI</small><strong>{topic.source}</strong></span><ArrowUpRightIcon size={18} /></button>{sourceOpen && <div className="source-excerpt"><span>Örnek materyal bölümü</span><p>{topic.excerpt}</p></div>}</> : <div className="empty-answer"><BookOpenIcon size={28} /><h3>Bu soru için henüz yanıt yok.</h3><p>Yeni soruyu inceleyebilirsin. Canlı model bağlandığında materyallerde ilgili kaynak aranacak.</p></div> : <ol className="original-questions">{topic.questions.map((question, index) => <li key={index}><span className="question-bubble"><ChatsCircleIcon size={16} /></span><p>{question}</p></li>)}</ol>}</div><footer className="answer-actions"><button className="button primary" disabled={!topic.answer || topic.shared} onClick={() => { update({ shared: true }); notify('Örnek yanıt katılımcı ekranıyla paylaşıldı.'); }}>{topic.shared ? <CheckIcon size={17} /> : <PaperPlaneTiltIcon size={17} />}{topic.shared ? 'Yanıt paylaşıldı' : 'Yanıtı paylaş'}</button><button className="button quiet" onClick={() => { update({ resolved: !topic.resolved }); notify(topic.resolved ? 'Konu yeniden bekleyenlere eklendi.' : 'Konu ele alındı olarak işaretlendi.'); }}><CheckCircleIcon size={18} />{topic.resolved ? 'Yeniden aç' : 'Ele alındı'}</button></footer></section>
        </div>
        <section className="next-step"><div className="next-step-icon"><LightningIcon size={22} weight="fill" /></div><div><span>OTURUM İÇİN BİR FİKİR</span><p>Hedef kitle konusunu kısa bir örnekle birlikte açabilirsiniz.</p></div><button onClick={() => setActivity(!activity)} className="text-button">{activity ? 'Örneği kapat' : 'Etkinlik örneğini gör'}<ArrowRightIcon size={17} /></button></section>{activity && <section className="activity-example"><h3>Bir kahve dükkânı açıyorsun.</h3><p>İlk müşterin kim olurdu? İhtiyacını, hangi kanalda ona ulaşacağını ve mesajını birer cümleyle yaz.</p><span>Örnek düşünme etkinliği · 3 dakika</span></section>}
      </> : screen === 'prep' ? <Preparation notify={notify} /> : <Report topics={topics} onReturn={() => setScreen('live')} notify={notify} />}
      <footer className="workspace-footer"><button onClick={() => { setTopics(initialTopics); setSelected('audience'); setFilter('all'); setTab('answer'); setSourceOpen(false); notify('Örnek eğitim başlangıç durumuna döndü.'); }}>Örnek eğitimi sıfırla</button><span>Örnek veriler · Canlı yapay zekâ henüz bağlı değil</span></footer>
    </main>{toast && <div className="toast" role="status"><CheckCircleIcon size={20} />{toast}</div>}
  </div>;
}

function Preparation({ notify }: { notify: (message: string) => void }) {
  const [profile, setProfile] = useState('Yeni başlayan');
  const [rehearsal, setRehearsal] = useState(false);
  const [filename, setFilename] = useState('');
  return <div className="prep-layout"><section className="prep-materials"><span className="section-index">01 / MATERYALLER</span><h2>Eğitimin bilgi kaynağı.</h2><p>Prova, sorular ve yanıtlar aynı materyal etrafında şekillenir.</p><div className="material-file"><FileTextIcon size={28} /><span><strong>Dijital pazarlama notları</strong><small>Örnek materyal · 6 bölüm</small></span><span className="material-tag">Örnek</span></div><label className="upload-area"><PlusIcon size={24} /><strong>Bir materyal seç</strong><span>Dosya seçimini bu taslakta deneyebilirsin.</span><input type="file" accept=".pdf,.docx,.pptx" onChange={event => { setFilename(event.target.files?.[0]?.name ?? ''); notify('Dosya seçildi. İçerik işleme bir sonraki aşamada eklenecek.'); }} /></label>{filename && <p className="selection-note"><CheckIcon size={16} />{filename} seçildi; henüz işlenmedi.</p>}</section><section className="prep-rehearsal"><span className="section-index">02 / PROVA</span><h2>Katılımcının gözünden bak.</h2><p>Farklı bilgi düzeyleri, aynı konuya farklı sorular getirir.</p><label className="field-label" htmlFor="profile">Katılımcı profili</label><select id="profile" value={profile} onChange={event => { setProfile(event.target.value); setRehearsal(false); }}><option>Yeni başlayan</option><option>Deneyimli uzman</option><option>Meraklı ve sorgulayıcı</option></select><button className="button primary" onClick={() => setRehearsal(true)}><SparkleIcon size={18} />Örnek provayı aç</button>{rehearsal && <div className="rehearsal-example"><span>{profile} · Örnek soru</span><h3>{profile === 'Yeni başlayan' ? 'Hedef kitleyi daraltırsam müşteri kaybetmez miyim?' : profile === 'Deneyimli uzman' ? 'Persona varsayımlarını gerçek müşteri verileriyle nasıl doğrularız?' : 'Herkese hitap eden ürünlerin başarısını nasıl açıklıyorsunuz?'}</h3><p>Bu soruyu açıklarken somut bir örnek kullanmayı ve katılımcının varsayımını ele almayı deneyebilirsin.</p><small>Bu taslakta hazır prova örnekleri gösteriliyor.</small></div>}</section></div>;
}

function Report({ topics, onReturn, notify }: { topics: Topic[]; onReturn: () => void; notify: (message: string) => void }) {
  const total = topics.reduce((sum, item) => sum + item.questions.length, 0);
  const exportReport = () => {
    const text = `LİNBA — Örnek oturum raporu\n\n${total} soru, ${topics.length} konu başlığı.\n\n${topics.map(topic => `${topic.title}\n${topic.questions.length} soru · ${topic.resolved ? 'Ele alındı' : 'Bekliyor'}\n${topic.questions.join('\n')}`).join('\n\n')}\n\nBu rapor tasarım önizlemesi verileridir.`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'linba-ornek-oturum-raporu.txt'; link.click(); URL.revokeObjectURL(url); notify('Örnek rapor indirildi.');
  };
  return <section className="report-layout"><div className="report-heading"><div><span className="section-index">OTURUM ÖZETİ</span><h2>Soruların anlattıkları.</h2><p>Bu özet, taslakta gördüğün soru kayıtlarından hazırlanır.</p></div><button className="button dark" onClick={exportReport}><ClipboardTextIcon size={18} />Raporu indir</button></div><div className="report-stats"><div><strong>{total}</strong><span>Katılımcı sorusu</span></div><div><strong>{topics.length}</strong><span>Konu başlığı</span></div><div><strong>{topics.filter(topic => topic.shared).length}</strong><span>Paylaşılan yanıt</span></div></div><div className="report-topics"><h3>Konulara göre soru dağılımı</h3>{topics.map(topic => <div className="report-row" key={topic.id}><span>{topic.title}</span><div className="bar-track"><div style={{ width: `${topic.questions.length / Math.max(...topics.map(item => item.questions.length)) * 100}%` }} /></div><strong>{topic.questions.length}</strong><span className="report-state">{topic.resolved ? 'Ele alındı' : 'Bekliyor'}</span></div>)}</div><div className="report-bottom"><p>Bekleyen sorulara dönerek sonraki eğitimin için not alabilirsin.</p><button className="text-button" onClick={onReturn}>Sorulara dön<ArrowRightIcon size={17} /></button></div></section>;
}

export function Participant() {
  const [topics, setTopics] = useTopics();
  const [question, setQuestion] = useState('');
  const [message, setMessage] = useState('');
  const [participantTab, setParticipantTab] = useState<'ask' | 'answers'>('ask');
  const shared = topics.filter(topic => topic.shared);
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); const text = question.trim();
    if (text.length < 5) { setMessage('Sorunu biraz daha açık yazar mısın? En az 5 karakter gerekiyor.'); return; }
    setTopics(items => [...items, { id: `question-${Date.now()}`, title: text, questions: [text], shared: false, resolved: false }]);
    setQuestion(''); setMessage('Sorun eklendi. Aynı tarayıcıdaki eğitmen ekranında görünecek.');
  };
  return <main className="participant-page"><div className="participant-top"><Wordmark /><span className="participant-code">482 915</span></div><div className="participant-intro"><PreviewLabel /><h1>Dijital Pazarlama<br />Temelleri</h1><p>Merak ettiğin yerden başlayalım.</p><span className="participant-status"><span className="status-dot" />Örnek oturuma katıldın</span></div><div className="participant-tabs"><button className={participantTab === 'ask' ? 'active' : ''} onClick={() => setParticipantTab('ask')}>Soru sor</button><button className={participantTab === 'answers' ? 'active' : ''} onClick={() => setParticipantTab('answers')}>Paylaşılan yanıtlar<span>{shared.length}</span></button></div>{participantTab === 'ask' ? <><form className="question-form" onSubmit={submit}><label htmlFor="question">Aklındaki soru ne?</label><textarea id="question" placeholder="Örneğin, hedef kitlemi nasıl belirleyebilirim?" value={question} onChange={event => { setQuestion(event.target.value); setMessage(''); }} maxLength={500} /><div className="input-meta"><span>İsim vermeden soru sorabilirsin.</span><span>{question.length}/500</span></div><button className="button primary full" type="submit"><PaperPlaneTiltIcon size={18} />Sorumu gönder</button><p className="form-message" role="status">{message}</p></form><section className="participant-note"><span className="participant-note-icon"><ChatsCircleIcon size={24} /></span><h2>Bir soru, yeni bir bakış.</h2><p>Küçük ya da büyük fark etmez. Anlaşılmayan bir nokta, birlikte öğrenmek için iyi bir başlangıçtır.</p></section></> : <section className="participant-answers">{shared.length ? shared.map(topic => <article key={topic.id}><span className="shared-label"><CheckCircleIcon size={15} />Eğitmen paylaştı · Örnek yanıt</span><h2>{topic.title}</h2>{topic.answer?.split('\n\n').map(text => <p key={text}>{text}</p>)}<span className="participant-source"><FileTextIcon size={17} />{topic.source}</span></article>) : <div className="empty-state"><BookOpenIcon size={30} /><h2>Yanıtlar burada buluşacak.</h2><p>Eğitmenin paylaştığı yanıtları kaynaklarıyla birlikte görebileceksin.</p></div>}</section>}<footer className="participant-footer"><span>Birlikte öğrenmek için.</span><a href="/">Eğitmen ekranı<ArrowUpRightIcon size={14} /></a></footer></main>;
}
