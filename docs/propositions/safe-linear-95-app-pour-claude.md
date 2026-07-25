# SAFE, prototype intérieur inspiré de Linear

## Objectif

Améliorer ce brouillon d’interface intérieure de SAFE sans modifier directement l’application de production.

SAFE est un SaaS de gestion pour cabinets d’avocats. Le prototype reprend la grammaire d’interface de Linear tout en conservant le vocabulaire, la typographie et l’accent vert fonctionnel de SAFE.

## Contraintes à transmettre à Claude

- Travailler uniquement sur ce prototype autonome.
- Ne pas modifier la landing page ni l’application Next.js de SAFE.
- Conserver Geist pour l’interface et Geist Mono pour les références et montants.
- Employer le vert SAFE avec retenue, principalement pour les actions et statuts.
- Maintenir une barre latérale de 244 px et des lignes de liste de 44 px sur ordinateur.
- Éviter les cartes de dashboard, les ombres décoratives, les dégradés et les grands rayons génériques.
- Favoriser une interface de travail continue, dense et calme.
- Conserver la voix « vous » et éviter les em-dashes dans le copywriting.
- Préserver les vues et interactions existantes : dossiers, facturation, fidéicommis, recherche, fiche dossier et navigation mobile.
- Vérifier chaque amélioration sur ordinateur et mobile.

## Code HTML autonome

Enregistrez le contenu du bloc suivant dans un fichier `.html` pour l’ouvrir localement.

```html
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SAFE, direction interface inspirée de Linear</title>
  <style>
    @font-face{font-family:Geist;src:url("./assets/fonts/Geist-Variable.woff2") format("woff2");font-weight:100 900;font-display:swap}
    @font-face{font-family:Geist Mono;src:url("./assets/fonts/GeistMono-Variable.woff2") format("woff2");font-weight:100 900;font-display:swap}
    @font-face{font-family:Instrument Serif;src:url("./assets/fonts/InstrumentSerif-Regular.woff2") format("woff2");font-weight:400;font-display:swap}

    :root{
      --shell:#f1f1ef;
      --surface:#fcfcfb;
      --surface-raised:#fff;
      --surface-muted:#f6f6f4;
      --surface-active:#e8e8e5;
      --border:#e6e6e3;
      --border-strong:#d9d9d5;
      --text:#171715;
      --text-2:#3f3f3b;
      --text-3:#6c6c66;
      --text-4:#999992;
      --safe:#254c3a;
      --safe-soft:#e6eee9;
      --amber:#936929;
      --red:#a4433a;
      --blue:#55728e;
      --purple:#6e6388;
      --sidebar:244px;
      --topbar:44px;
      --row:44px;
    }

    *{box-sizing:border-box}
    html,body{height:100%;margin:0}
    body{
      background:var(--shell);
      color:var(--text);
      font-family:Geist,ui-sans-serif,system-ui,sans-serif;
      font-size:13px;
      font-weight:450;
      letter-spacing:-.008em;
      overflow:hidden;
    }
    button,input{font:inherit}
    button{color:inherit}
    svg{display:block}
    .icon{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
    .icon-sm{width:14px;height:14px}
    .mono{font-family:"Geist Mono",monospace;font-variant-numeric:tabular-nums}

    .app{height:100%;display:grid;grid-template-columns:var(--sidebar) minmax(0,1fr)}
    .sidebar{height:100%;padding:7px 8px 10px;display:flex;flex-direction:column;min-width:0}
    .sidebar-backdrop{display:none}
    .workspace-switch{
      width:100%;height:36px;padding:0 7px;border:0;background:transparent;border-radius:7px;
      display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer
    }
    .workspace-switch:hover{background:rgba(0,0,0,.035)}
    .brand-mark{
      width:22px;height:22px;border-radius:6px;background:var(--safe);color:#fff;display:grid;place-items:center;
      font-family:"Instrument Serif",serif;font-size:15px;line-height:1
    }
    .workspace-name{min-width:0;flex:1;font-weight:570;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .chevrons{color:var(--text-4)}

    .quick-actions{display:grid;grid-template-columns:1fr 31px;gap:4px;margin:5px 2px 8px}
    .quick,.create{
      height:30px;border:0;background:transparent;border-radius:7px;color:var(--text-3);
      display:flex;align-items:center;gap:9px;padding:0 8px;cursor:pointer
    }
    .quick:hover,.create:hover{background:rgba(0,0,0,.045);color:var(--text)}
    .quick kbd{margin-left:auto;color:var(--text-4);font-size:10px;background:transparent;font-family:inherit}
    .create{justify-content:center;padding:0}

    .nav-scroll{min-height:0;overflow:auto;scrollbar-width:none}
    .nav-scroll::-webkit-scrollbar{display:none}
    .nav-item,.section-toggle{
      width:100%;height:30px;border:0;background:transparent;border-radius:7px;padding:0 8px;
      display:flex;align-items:center;gap:9px;text-align:left;color:var(--text-3);cursor:pointer
    }
    .nav-item:hover,.section-toggle:hover{background:rgba(0,0,0,.035);color:var(--text)}
    .nav-item.active{background:var(--surface-active);color:var(--text);font-weight:520}
    .nav-item .count{margin-left:auto;color:var(--text-4);font-size:11px}
    .nav-item .tiny-dot{width:6px;height:6px;border-radius:50%;background:var(--safe);margin-left:auto}
    .nav-gap{height:8px}
    .nav-section{margin-top:9px}
    .section-toggle{
      height:26px;padding-left:8px;color:var(--text-4);font-size:11px;font-weight:540;
      letter-spacing:.015em
    }
    .section-toggle .section-chevron{margin-left:auto;transition:transform .16s ease}
    .section-toggle.collapsed .section-chevron{transform:rotate(-90deg)}
    .section-items{display:grid}
    .section-items.hidden{display:none}
    .section-items .nav-item{padding-left:13px}
    .section-icon{width:15px;height:15px;color:var(--text-4);display:grid;place-items:center}
    .section-icon svg{width:15px;height:15px}

    .user{
      margin-top:auto;height:36px;border-radius:7px;padding:0 7px;display:flex;align-items:center;gap:9px;
      color:var(--text-3);cursor:pointer
    }
    .user:hover{background:rgba(0,0,0,.035)}
    .avatar{width:22px;height:22px;border-radius:50%;background:#d5ded8;color:var(--safe);display:grid;place-items:center;font-size:10px;font-weight:650}
    .presence{width:6px;height:6px;border-radius:50%;background:#448264;margin-left:auto}

    .workspace{
      min-width:0;height:calc(100% - 16px);margin:8px 8px 8px 0;background:var(--surface);
      border:1px solid rgba(0,0,0,.035);border-radius:11px;overflow:hidden;display:flex;flex-direction:column
    }
    .topbar{
      height:var(--topbar);min-height:var(--topbar);border-bottom:1px solid var(--border);padding:0 11px;
      display:flex;align-items:center;gap:6px;color:var(--text-3)
    }
    .crumb{height:28px;padding:0 5px;border:0;background:transparent;border-radius:6px;display:flex;align-items:center;gap:6px;cursor:pointer}
    .crumb:hover{background:var(--surface-muted);color:var(--text)}
    .crumb.current{color:var(--text);font-weight:520}
    .crumb-sep{color:var(--text-4)}
    .top-actions{margin-left:auto;display:flex;align-items:center;gap:3px}
    .icon-btn,.text-btn{
      height:28px;border:0;background:transparent;border-radius:6px;display:flex;align-items:center;justify-content:center;
      color:var(--text-3);cursor:pointer
    }
    .icon-btn{width:28px}
    .text-btn{padding:0 8px;gap:6px}
    .icon-btn:hover,.text-btn:hover{background:var(--surface-muted);color:var(--text)}
    .create-main{background:var(--safe);color:#fff;padding:0 10px}
    .create-main:hover{background:#1e4030;color:#fff}

    .view{display:none;min-height:0;flex:1;overflow:hidden}
    .view.active{display:flex;flex-direction:column}
    .list-toolbar{
      height:44px;min-height:44px;border-bottom:1px solid var(--border);padding:0 15px;
      display:flex;align-items:center;gap:14px
    }
    .tabs{height:100%;display:flex;align-items:stretch;gap:17px}
    .tab{
      border:0;background:transparent;padding:1px 0 0;color:var(--text-3);position:relative;cursor:pointer;font-size:12px
    }
    .tab.active{color:var(--text);font-weight:540}
    .tab.active:after{content:"";position:absolute;height:1px;background:var(--text);left:0;right:0;bottom:-1px}
    .toolbar-spacer{flex:1}
    .list-content{flex:1;min-height:0;overflow:auto}
    .group-header{
      position:sticky;top:0;z-index:2;height:36px;background:rgba(252,252,251,.96);backdrop-filter:blur(8px);
      border-bottom:1px solid var(--border);padding:0 15px;display:grid;grid-template-columns:18px minmax(0,1fr) auto;
      align-items:center;gap:9px;color:var(--text-3);font-size:12px;font-weight:540
    }
    .group-header .group-meta{font-weight:450;color:var(--text-4)}
    .collapse-dot{width:16px;height:16px;border-radius:4px;display:grid;place-items:center}
    .collapse-dot:hover{background:var(--surface-muted)}

    .issue-row{
      width:100%;height:var(--row);border:0;border-bottom:1px solid var(--border);background:transparent;
      padding:0 15px;display:grid;grid-template-columns:18px 18px 70px minmax(220px,1fr) 150px 96px 22px 24px;
      align-items:center;gap:9px;text-align:left;cursor:pointer;color:var(--text-2)
    }
    .row-avatar{width:20px;height:20px;border-radius:50%;background:#d5ded8;color:var(--safe);display:grid;place-items:center;font-size:8.5px;font-weight:650;justify-self:center;letter-spacing:0}
    .issue-row:hover{background:var(--surface-muted)}
    .issue-row.selected{background:#f1f3f1}
    .check{width:14px;height:14px;border:1px solid var(--border-strong);border-radius:4px;background:#fff}
    .priority{width:16px;height:16px;display:flex;align-items:flex-end;gap:1px;padding:2px}
    .priority i{display:block;width:2px;background:currentColor;border-radius:1px}
    .priority i:nth-child(1){height:3px}.priority i:nth-child(2){height:6px}.priority i:nth-child(3){height:9px}
    .priority.medium{color:var(--amber)}.priority.low{color:var(--text-4)}.priority.high{color:var(--red)}
    .ref{font-family:"Geist Mono",monospace;color:var(--text-4);font-size:11px}
    .issue-title{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .issue-title strong{font-weight:520;color:var(--text)}
    .issue-title .note{margin-left:7px;color:var(--text-4);font-size:11px}
    .client{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-3);font-size:12px}
    .due{justify-self:end;color:var(--text-4);font-size:11px}
    .due.today{color:var(--amber)}
    .status-icon{width:16px;height:16px;border-radius:50%;border:1.5px solid currentColor;color:var(--blue);position:relative}
    .status-icon.progress:after{content:"";position:absolute;inset:3px;border-radius:50%;background:currentColor}
    .status-icon.waiting{color:var(--amber);border-style:dashed}
    .row-menu{opacity:0;color:var(--text-4);width:24px;height:24px;border-radius:5px;display:grid;place-items:center}
    .issue-row:hover .row-menu,.issue-row:focus-visible .row-menu{opacity:1}

    .empty-space{height:70px}
    .inline-summary{
      height:36px;border-bottom:1px solid var(--border);padding:0 15px;color:var(--text-4);
      display:flex;align-items:center;gap:14px;font-size:11px
    }
    .inline-summary b{color:var(--text-2);font-weight:520}

    .palette-backdrop{position:fixed;inset:0;z-index:40;display:none;background:rgba(20,20,18,.30);align-items:flex-start;justify-content:center}
    .palette-backdrop.open{display:flex}
    .palette{width:min(600px,calc(100% - 32px));margin-top:13vh;background:var(--surface-raised);border:1px solid var(--border-strong);border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,.22);overflow:hidden;animation:palette-in .14s cubic-bezier(.2,.7,.2,1)}
    @keyframes palette-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    .search-input-wrap{height:48px;padding:0 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .search-input{border:0;outline:0;background:transparent;font-size:15px;width:100%;color:var(--text)}
    .search-input::placeholder{color:var(--text-4)}
    .search-filters{display:flex;gap:6px;padding:11px 14px 0}
    .search-filter{
      height:26px;border:1px solid var(--border);border-radius:6px;background:transparent;padding:0 8px;
      color:var(--text-3);font-size:11px;cursor:pointer
    }
    .search-filter.active{background:var(--surface-active);border-color:transparent;color:var(--text)}
    .recent{padding:11px 8px 10px;max-height:44vh;overflow:auto}
    .recent-title{color:var(--text-4);font-size:11px;margin:0 6px 4px}
    .recent-row{height:38px;border-radius:7px;display:flex;align-items:center;gap:9px;padding:0 8px;color:var(--text-3);cursor:pointer}
    .recent-row:hover,.recent-row.cursor{background:var(--surface-muted);color:var(--text)}
    .recent-row .recent-type{margin-left:auto;color:var(--text-4);font-size:11px}
    .recent-row[hidden]{display:none}
    .palette-foot{height:34px;border-top:1px solid var(--border);display:flex;align-items:center;gap:16px;padding:0 14px;color:var(--text-4);font-size:11px}
    .palette-foot span{display:flex;align-items:center;gap:6px}
    .palette-foot kbd{font-family:inherit;background:var(--surface-muted);border:1px solid var(--border);border-radius:4px;padding:1px 5px;font-size:10px;color:var(--text-3)}
    .search-empty{display:none;padding:30px 8px;color:var(--text-4);text-align:center;font-size:12px}
    .search-empty.visible{display:block}

    .detail-view{min-height:0}
    .detail-layout{display:grid;grid-template-columns:minmax(0,1fr) 318px;min-height:0;flex:1}
    .document{min-width:0;overflow:auto}
    .document-inner{width:min(760px,calc(100% - 64px));margin:0 auto;padding:50px 0 100px}
    .detail-kicker{display:flex;align-items:center;gap:8px;color:var(--text-4);font-size:11px;margin-bottom:14px}
    .detail-title{font-size:26px;line-height:1.2;letter-spacing:-.035em;font-weight:590;margin:0 0 17px;max-width:680px}
    .mobile-properties{display:none}
    .description{font-size:14px;line-height:1.65;color:var(--text-2);max-width:650px;margin:0 0 34px}
    .subtasks{margin-bottom:27px}
    .subtask-row{
      height:36px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:18px 72px minmax(0,1fr) auto;
      align-items:center;gap:9px;color:var(--text-3);font-size:12px
    }
    .subtask-row:hover{background:linear-gradient(90deg,transparent,var(--surface-muted) 6%,var(--surface-muted) 94%,transparent)}
    .subtask-row.done{color:var(--text-4)}
    .subtask-row.done .subtask-title{text-decoration:line-through}
    .subtask-row .subtask-date{color:var(--text-4);font-size:11px}
    .check.done{background:var(--safe);border-color:var(--safe);position:relative}
    .check.done:after{content:"";position:absolute;left:3px;top:2px;width:5px;height:3px;border:solid #fff;border-width:0 0 1.5px 1.5px;transform:rotate(-45deg)}
    .section-heading{height:32px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:580;color:var(--text-2);border-bottom:1px solid var(--border)}
    .section-heading .section-count{font-weight:450;color:var(--text-4)}
    .activity-item{display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;padding:15px 0;border-bottom:1px solid var(--border)}
    .activity-avatar{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:650;color:var(--safe);background:var(--safe-soft)}
    .activity-top{display:flex;align-items:baseline;gap:7px;font-size:12px}
    .activity-top strong{font-weight:580}
    .activity-time{color:var(--text-4);font-size:11px}
    .activity-body{margin-top:5px;color:var(--text-3);font-size:12px;line-height:1.5}
    .comment-box{margin-top:17px;border:1px solid var(--border-strong);border-radius:8px;background:var(--surface-raised);padding:11px 12px}
    .comment-placeholder{color:var(--text-4);height:46px}
    .comment-actions{display:flex;align-items:center;border-top:1px solid var(--border);padding-top:8px}
    .send{margin-left:auto;height:26px;border:0;border-radius:6px;background:var(--surface-active);padding:0 9px;color:var(--text-3)}

    .properties{border-left:1px solid var(--border);overflow:auto;padding:16px 14px 40px}
    .prop-heading{display:flex;align-items:center;height:28px;font-size:12px;font-weight:580;margin-bottom:6px}
    .prop-row{min-height:34px;display:grid;grid-template-columns:102px minmax(0,1fr);align-items:center;padding:2px 4px;border-radius:6px;font-size:12px}
    .prop-row:hover{background:var(--surface-muted)}
    .prop-label{color:var(--text-4)}
    .prop-value{min-width:0;color:var(--text-2);display:flex;align-items:center;gap:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .prop-dot{width:8px;height:8px;border-radius:50%;background:var(--blue)}
    .prop-dot.green{background:#4f7d64}.prop-dot.amber{background:#aa7d3b}.prop-dot.purple{background:var(--purple)}
    .prop-separator{height:1px;background:var(--border);margin:13px 4px}
    .file{height:44px;border-radius:6px;display:flex;align-items:center;gap:8px;padding:0 6px;color:var(--text-2)}
    .file:hover{background:var(--surface-muted)}
    .file-type{width:28px;height:30px;border:1px solid var(--border);border-radius:5px;background:#fff;display:grid;place-items:center;color:var(--red);font-size:8px;font-weight:680}
    .file-meta{color:var(--text-4);font-size:10px;margin-top:2px}

    .toast{
      position:fixed;left:50%;bottom:20px;z-index:10;transform:translate(-50%,16px);opacity:0;pointer-events:none;
      background:#242421;color:#fff;border-radius:7px;padding:9px 12px;font-size:12px;box-shadow:0 5px 22px rgba(0,0,0,.14);
      transition:.18s ease
    }
    .toast.show{opacity:1;transform:translate(-50%,0)}

    @media(max-width:1024px){
      :root{--sidebar:0px}
      .app{grid-template-columns:1fr}
      .sidebar{
        display:flex;position:fixed;z-index:30;left:0;top:0;width:244px;background:var(--shell);
        transform:translateX(-102%);transition:transform .18s cubic-bezier(.2,.7,.2,1);box-shadow:12px 0 38px rgba(0,0,0,.08)
      }
      .sidebar.open{transform:translateX(0)}
      .sidebar-backdrop{
        display:block;position:fixed;z-index:29;top:0;right:0;bottom:0;left:244px;background:rgba(20,20,18,.18);opacity:0;pointer-events:none;
        transition:opacity .18s ease
      }
      .sidebar-backdrop.open{opacity:1;pointer-events:auto}
      .workspace{margin-left:8px}
      .mobile-menu{display:flex!important}
    }
    @media(max-width:760px){
      :root{--row:56px}
      body{background:var(--surface)}
      .workspace{height:100%;margin:0;border:0;border-radius:0}
      .topbar{padding:0 8px}
      .crumb:not(.current),.crumb-sep{display:none}
      .list-toolbar{padding:0 10px}
      .issue-row{padding:0 11px;grid-template-columns:18px 18px 54px minmax(0,1fr) 24px;gap:7px}
      .client,.due,.row-avatar{display:none}
      .issue-title{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.3}
      .issue-title .note{display:none}
      .row-menu{opacity:1}
      .group-header{padding:0 11px}
      .detail-layout{display:block;overflow:auto}
      .document{overflow:visible}
      .document-inner{width:auto;margin:0;padding:28px 18px 80px}
      .detail-title{font-size:23px}
      .properties{display:none}
      .mobile-properties{display:flex;flex-wrap:wrap;gap:6px;margin:-3px 0 24px}
      .mobile-pill{height:25px;border:1px solid var(--border);border-radius:6px;padding:0 8px;display:flex;align-items:center;gap:6px;color:var(--text-3);font-size:11px}
      .search-shell{width:calc(100% - 32px);margin-top:7vh}
      .hide-mobile{display:none!important}
    }
    .mobile-menu{display:none}
    :focus-visible{outline:2px solid rgba(37,76,58,.35);outline-offset:-2px}
  </style>
</head>
<body>
  <svg width="0" height="0" style="position:absolute">
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="i-inbox" viewBox="0 0 24 24"><path d="M4 4h16v13H4z"/><path d="M4 13h4l2 3h4l2-3h4"/></symbol>
    <symbol id="i-today" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></symbol>
    <symbol id="i-grid" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></symbol>
    <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 7h7l2 2h9v10H3z"/></symbol>
    <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3.5 19c.7-3.2 2.5-5 5.5-5s4.8 1.8 5.5 5M14.5 15.5c2.8-.5 4.8.7 5.5 3.5"/></symbol>
    <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></symbol>
    <symbol id="i-invoice" viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></symbol>
    <symbol id="i-bank" viewBox="0 0 24 24"><path d="m3 9 9-5 9 5M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M3 20h18"/></symbol>
    <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 4.5 6v5c0 5 3 8.5 7.5 10 4.5-1.5 7.5-5 7.5-10V6z"/><path d="m9 12 2 2 4-5"/></symbol>
    <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></symbol>
    <symbol id="i-display" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 21h8M12 18v3"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14"/></symbol>
    <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
    <symbol id="i-paperclip" viewBox="0 0 24 24"><path d="m9 17 8-8a3 3 0 0 0-4-4l-8 8a5 5 0 0 0 7 7l8-8"/></symbol>
  </svg>

  <div class="app">
    <aside class="sidebar">
      <button class="workspace-switch">
        <span class="brand-mark">S</span>
        <span class="workspace-name">Cabinet Camille Roy</span>
        <svg class="icon icon-sm chevrons"><path d="m7 9 5-5 5 5M7 15l5 5 5-5"/></svg>
      </button>

      <div class="quick-actions">
        <button class="quick" data-view="search"><svg class="icon"><use href="#i-search"/></svg>Rechercher <kbd>⌘ K</kbd></button>
        <button class="create" data-toast="Nouveau dossier"><svg class="icon"><use href="#i-plus"/></svg></button>
      </div>

      <div class="nav-scroll">
        <button class="nav-item" data-view="inbox"><svg class="icon"><use href="#i-inbox"/></svg>Navette<span class="count">4</span></button>
        <button class="nav-item" data-view="today"><svg class="icon"><use href="#i-today"/></svg>Aujourd’hui<span class="tiny-dot"></span></button>

        <div class="nav-section">
          <button class="section-toggle" data-section="cabinet">Cabinet <svg class="icon icon-sm section-chevron"><path d="m7 9 5 5 5-5"/></svg></button>
          <div class="section-items" id="cabinet-section">
            <button class="nav-item" data-view="overview"><span class="section-icon"><svg class="icon"><use href="#i-grid"/></svg></span>Vue d’ensemble</button>
            <button class="nav-item active" data-view="matters"><span class="section-icon"><svg class="icon"><use href="#i-folder"/></svg></span>Dossiers</button>
            <button class="nav-item" data-view="clients"><span class="section-icon"><svg class="icon"><use href="#i-users"/></svg></span>Clients</button>
            <button class="nav-item" data-view="calendar"><span class="section-icon"><svg class="icon"><use href="#i-calendar"/></svg></span>Agenda</button>
          </div>
        </div>

        <div class="nav-section">
          <button class="section-toggle" data-section="finances">Finances <svg class="icon icon-sm section-chevron"><path d="m7 9 5 5 5-5"/></svg></button>
          <div class="section-items" id="finances-section">
            <button class="nav-item" data-view="billing"><span class="section-icon"><svg class="icon"><use href="#i-invoice"/></svg></span>Facturation</button>
            <button class="nav-item" data-view="trust"><span class="section-icon"><svg class="icon"><use href="#i-bank"/></svg></span>Fidéicommis</button>
            <button class="nav-item" data-view="compliance"><span class="section-icon"><svg class="icon"><use href="#i-shield"/></svg></span>Conformité</button>
          </div>
        </div>

        <div class="nav-section">
          <button class="section-toggle" data-section="resources">Ressources <svg class="icon icon-sm section-chevron"><path d="m7 9 5 5 5-5"/></svg></button>
          <div class="section-items" id="resources-section">
            <button class="nav-item" data-view="documents"><span class="section-icon"><svg class="icon"><use href="#i-doc"/></svg></span>Documents</button>
          </div>
        </div>
      </div>

      <div class="user"><span class="avatar">CR</span><span>Me Camille Roy</span><span class="presence"></span></div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <button class="icon-btn mobile-menu" id="mobile-nav" aria-label="Ouvrir la navigation"><svg class="icon"><use id="mobile-nav-use" href="#i-menu"/></svg></button>
        <button class="crumb" data-view="matters">Cabinet</button>
        <span class="crumb-sep">/</span>
        <button class="crumb current" id="current-crumb">Dossiers</button>
        <div class="top-actions">
          <button class="text-btn hide-mobile" id="list-filter"><svg class="icon icon-sm"><use href="#i-filter"/></svg>Filtrer</button>
          <button class="text-btn hide-mobile" id="list-display"><svg class="icon icon-sm"><use href="#i-display"/></svg>Affichage</button>
          <button class="text-btn" id="detail-timer" data-toast="Chronomètre démarré" style="display:none"><svg class="icon icon-sm"><use href="#i-today"/></svg><span class="hide-mobile">Démarrer le chrono</span></button>
          <button class="icon-btn" data-toast="Plus d’options"><svg class="icon"><use href="#i-more"/></svg></button>
          <button class="text-btn create-main" data-toast="Créer un dossier"><svg class="icon icon-sm"><use href="#i-plus"/></svg><span class="hide-mobile">Nouveau</span></button>
        </div>
      </header>

      <section class="view active" id="view-matters">
        <div class="list-toolbar">
          <div class="tabs">
            <button class="tab active">Actifs</button>
            <button class="tab">À venir</button>
            <button class="tab">Tous</button>
          </div>
          <span class="toolbar-spacer"></span>
          <span style="color:var(--text-4);font-size:11px">12 dossiers</span>
        </div>
        <div class="list-content">
          <div class="group-header"><span class="collapse-dot">⌄</span><span>À traiter cette semaine</span><span class="group-meta">4</span></div>
          <button class="issue-row" data-detail>
            <span class="check"></span><span class="priority high"><i></i><i></i><i></i></span><span class="ref">DOS-247</span>
            <span class="issue-title"><strong>Réviser la demande introductive d’instance</strong><span class="note">2</span></span>
            <span class="client">Aaliyah Côté</span><span class="due today">Aujourd’hui</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="check"></span><span class="priority medium"><i></i><i></i><i></i></span><span class="ref">DOS-251</span>
            <span class="issue-title"><strong>Préparer les pièces pour la conférence</strong></span>
            <span class="client">Groupe Lavoie</span><span class="due">Demain</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="check"></span><span class="priority medium"><i></i><i></i><i></i></span><span class="ref">DOS-238</span>
            <span class="issue-title"><strong>Obtenir les instructions de règlement</strong><span class="note">1</span></span>
            <span class="client">Nadia Tremblay</span><span class="due">25 juill.</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="check"></span><span class="priority low"><i></i><i></i><i></i></span><span class="ref">DOS-229</span>
            <span class="issue-title"><strong>Classer la correspondance reçue</strong></span>
            <span class="client">9078-4211 Québec inc.</span><span class="due">26 juill.</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>

          <div class="group-header"><span class="collapse-dot">⌄</span><span>En cours</span><span class="group-meta">5</span></div>
          <button class="issue-row" data-detail>
            <span class="status-icon progress"></span><span class="priority high"><i></i><i></i><i></i></span><span class="ref">DOS-214</span>
            <span class="issue-title"><strong>Négociation du bail commercial</strong><span class="note">6</span></span>
            <span class="client">Atelier du Nord inc.</span><span class="due">30 juill.</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="status-icon progress"></span><span class="priority medium"><i></i><i></i><i></i></span><span class="ref">DOS-205</span>
            <span class="issue-title"><strong>Convention entre actionnaires</strong></span>
            <span class="client">Tremblay & Fils</span><span class="due">2 août</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="status-icon waiting"></span><span class="priority low"><i></i><i></i><i></i></span><span class="ref">DOS-198</span>
            <span class="issue-title"><strong>Vérification diligente immobilière</strong><span class="note">3</span></span>
            <span class="client">Karim Ouellet</span><span class="due">6 août</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="status-icon waiting"></span><span class="priority low"><i></i><i></i><i></i></span><span class="ref">DOS-184</span>
            <span class="issue-title"><strong>Suivi de la médiation familiale</strong></span>
            <span class="client">Mélanie Gagnon</span><span class="due">9 août</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <div class="empty-space"></div>
        </div>
      </section>

      <section class="view" id="view-today">
        <div class="list-toolbar">
          <div class="tabs"><button class="tab active">Ma journée</button><button class="tab">Cette semaine</button></div>
          <span class="toolbar-spacer"></span>
          <span style="color:var(--text-4);font-size:11px">mercredi 23 juillet</span>
        </div>
        <div class="inline-summary"><span><b>3</b> échéances</span><span><b class="mono">2 h 10</b> à consigner</span><span><b>1</b> fidéicommis à vérifier</span></div>
        <div class="list-content">
          <div class="group-header"><span class="collapse-dot">⌄</span><span>Échéances aujourd’hui</span><span class="group-meta">3</span></div>
          <button class="issue-row" data-detail>
            <span class="check"></span><span class="priority high"><i></i><i></i><i></i></span><span class="ref">DOS-247</span>
            <span class="issue-title"><strong>Valider les conclusions et préparer le dépôt</strong></span>
            <span class="client">Aaliyah Côté</span><span class="due today">16:00</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="check"></span><span class="priority medium"><i></i><i></i><i></i></span><span class="ref">DOS-251</span>
            <span class="issue-title"><strong>Appeler la cliente avant la conférence</strong></span>
            <span class="client">Groupe Lavoie</span><span class="due today">Aujourd’hui</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="status-icon waiting"></span><span class="priority medium"><i></i><i></i><i></i></span><span class="ref">DOS-238</span>
            <span class="issue-title"><strong>Confirmer les instructions de règlement</strong><span class="note">1</span></span>
            <span class="client">Nadia Tremblay</span><span class="due today">Aujourd’hui</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>

          <div class="group-header"><span class="collapse-dot">⌄</span><span>Temps à consigner</span><span class="group-meta">2</span></div>
          <button class="issue-row" data-detail>
            <span class="status-icon progress"></span><span class="priority low"><i></i><i></i><i></i></span><span class="ref">DOS-214</span>
            <span class="issue-title"><strong>Négociation du bail, appel avec le bailleur</strong></span>
            <span class="client">Atelier du Nord inc.</span><span class="due mono">0 h 40</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-detail>
            <span class="status-icon progress"></span><span class="priority low"><i></i><i></i><i></i></span><span class="ref">DOS-205</span>
            <span class="issue-title"><strong>Rédaction de la convention entre actionnaires</strong></span>
            <span class="client">Tremblay &amp; Fils</span><span class="due mono">1 h 30</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>

          <div class="group-header"><span class="collapse-dot">⌄</span><span>Fidéicommis à surveiller</span><span class="group-meta">1</span></div>
          <button class="issue-row" data-toast="Compte en fidéicommis">
            <span class="check"></span><span class="status-icon waiting"></span><span class="ref">FID-039</span>
            <span class="issue-title"><strong>Atelier du Nord inc.</strong><span class="note">Rapprochement à vérifier</span></span>
            <span class="client">Compte général</span><span class="due mono">72 350,00 $</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <div class="empty-space"></div>
        </div>
      </section>

      <section class="view" id="view-billing">
        <div class="list-toolbar">
          <div class="tabs"><button class="tab active">À facturer</button><button class="tab">Brouillons</button><button class="tab">Émises</button></div>
          <span class="toolbar-spacer"></span><span style="color:var(--text-4);font-size:11px">Mois courant</span>
        </div>
        <div class="inline-summary"><span><b class="mono">18 420 $</b> à facturer</span><span><b class="mono">6 280 $</b> en retard</span><span><b>7</b> dossiers</span></div>
        <div class="list-content">
          <div class="group-header"><span class="collapse-dot">⌄</span><span>Prêt à facturer</span><span class="group-meta">4</span></div>
          <button class="issue-row" data-toast="Aperçu de facture">
            <span class="check"></span><span class="status-icon progress"></span><span class="ref">FAC-184</span>
            <span class="issue-title"><strong>Aaliyah Côté</strong><span class="note">DOS-247</span></span><span class="client">Honoraires et débours</span><span class="due mono">3 840,00 $</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-toast="Aperçu de facture">
            <span class="check"></span><span class="status-icon progress"></span><span class="ref">FAC-179</span>
            <span class="issue-title"><strong>Atelier du Nord inc.</strong><span class="note">DOS-214</span></span><span class="client">Honoraires</span><span class="due mono">6 215,00 $</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-toast="Aperçu de facture">
            <span class="check"></span><span class="status-icon waiting"></span><span class="ref">FAC-172</span>
            <span class="issue-title"><strong>Groupe Lavoie</strong><span class="note">DOS-251</span></span><span class="client">Honoraires et taxes</span><span class="due mono">2 970,00 $</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
        </div>
      </section>

      <section class="view" id="view-trust">
        <div class="list-toolbar">
          <div class="tabs"><button class="tab active">Comptes</button><button class="tab">Mouvements</button><button class="tab">Rapprochement</button></div>
          <span class="toolbar-spacer"></span><span style="color:var(--text-4);font-size:11px">Dernière synchro à 09:42</span>
        </div>
        <div class="inline-summary"><span><b class="mono">124 850,00 $</b> en fidéicommis</span><span><b>1</b> rapprochement à vérifier</span></div>
        <div class="list-content">
          <div class="group-header"><span class="collapse-dot">⌄</span><span>Comptes clients actifs</span><span class="group-meta">3</span></div>
          <button class="issue-row" data-toast="Compte en fidéicommis">
            <span class="check"></span><span class="status-icon progress"></span><span class="ref">FID-042</span>
            <span class="issue-title"><strong>Aaliyah Côté</strong><span class="note">DOS-247</span></span><span class="client">Compte général</span><span class="due mono">18 500,00 $</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
          <button class="issue-row" data-toast="Compte en fidéicommis">
            <span class="check"></span><span class="status-icon progress"></span><span class="ref">FID-039</span>
            <span class="issue-title"><strong>Atelier du Nord inc.</strong><span class="note">DOS-214</span></span><span class="client">Compte général</span><span class="due mono">72 350,00 $</span><span class="row-menu"><svg class="icon"><use href="#i-more"/></svg></span>
          </button>
        </div>
      </section>

      <div class="palette-backdrop" id="palette">
        <div class="palette" role="dialog" aria-label="Recherche et commandes" aria-modal="true">
          <div class="search-input-wrap"><svg class="icon" style="color:var(--text-4)"><use href="#i-search"/></svg><input class="search-input" id="search-input" placeholder="Rechercher un dossier, un client, une facture…"></div>
          <div class="search-filters">
            <button class="search-filter active" data-filter="all">Tout</button>
            <button class="search-filter" data-filter="dossier">Dossiers</button>
            <button class="search-filter" data-filter="facture">Factures</button>
            <button class="search-filter" data-filter="document">Documents</button>
          </div>
          <div class="recent">
            <div class="recent-title" id="results-title">Récemment consultés</div>
            <div class="recent-row search-result" data-detail data-kind="dossier" data-search="dos-247 aaliyah côté demande introductive"><svg class="icon"><use href="#i-folder"/></svg>DOS-247 · Aaliyah Côté<span class="recent-type">Dossier</span></div>
            <div class="recent-row search-result" data-kind="facture" data-search="fac-184 honoraires débours aaliyah côté"><svg class="icon"><use href="#i-invoice"/></svg>FAC-184 · Honoraires et débours<span class="recent-type">Facture</span></div>
            <div class="recent-row search-result" data-kind="document" data-search="demande introductive instance pdf aaliyah"><svg class="icon"><use href="#i-doc"/></svg>Demande introductive d’instance.pdf<span class="recent-type">Document</span></div>
            <div class="recent-row search-result" data-kind="dossier" data-search="dos-214 atelier nord bail commercial"><svg class="icon"><use href="#i-folder"/></svg>DOS-214 · Atelier du Nord inc.<span class="recent-type">Dossier</span></div>
            <div class="recent-row search-result" data-kind="document" data-search="chronologie litige cote doc"><svg class="icon"><use href="#i-doc"/></svg>Chronologie du litige.docx<span class="recent-type">Document</span></div>
            <div class="search-empty" id="search-empty">Aucun résultat dans cet espace de travail.</div>
          </div>
          <div class="palette-foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
            <span><kbd>↵</kbd> ouvrir</span>
            <span><kbd>esc</kbd> fermer</span>
          </div>
        </div>
      </div>

      <section class="view detail-view" id="view-detail">
        <div class="detail-layout">
          <article class="document">
            <div class="document-inner">
              <div class="detail-kicker"><span class="status-icon progress"></span><span class="mono">DOS-247</span><span>·</span><span>Litige civil</span></div>
              <h1 class="detail-title">Réviser la demande introductive d’instance</h1>
              <div class="mobile-properties">
                <span class="mobile-pill"><span class="prop-dot green"></span>En cours</span>
                <span class="mobile-pill">Aaliyah Côté</span>
                <span class="mobile-pill">Aujourd’hui</span>
              </div>
              <p class="description">Valider les faits allégués, les conclusions recherchées et les pièces annoncées avant le dépôt. Confirmer avec la cliente le montant final réclamé et la chronologie des mises en demeure.</p>

              <div class="subtasks">
                <div class="section-heading">Étapes <span class="section-count">2 sur 3</span></div>
                <div class="subtask-row done"><span class="check done"></span><span class="ref">DOS-247.1</span><span class="subtask-title">Vérifier les faits allégués avec la cliente</span><span class="subtask-date">Terminé</span></div>
                <div class="subtask-row done"><span class="check done"></span><span class="ref">DOS-247.2</span><span class="subtask-title">Indexer les pièces P-1 à P-6</span><span class="subtask-date">Terminé</span></div>
                <div class="subtask-row"><span class="check"></span><span class="ref">DOS-247.3</span><span class="subtask-title">Valider les conclusions et préparer le dépôt</span><span class="subtask-date">Aujourd’hui</span></div>
              </div>

              <div class="section-heading">Activité <span class="section-count">4</span></div>
              <div class="activity-item">
                <span class="activity-avatar">CR</span>
                <div><div class="activity-top"><strong>Camille Roy</strong><span class="activity-time">aujourd’hui à 09:18</span></div><div class="activity-body">A ajouté la version révisée de la demande et assigné la validation finale à Me Roy.</div></div>
              </div>
              <div class="activity-item">
                <span class="activity-avatar" style="background:#eee9df;color:#785f34">ML</span>
                <div><div class="activity-top"><strong>Marc Leduc</strong><span class="activity-time">hier à 16:42</span></div><div class="activity-body">Les pièces P-1 à P-6 sont indexées. La preuve de transmission de la mise en demeure reste à confirmer.</div></div>
              </div>
              <div class="activity-item">
                <span class="activity-avatar" style="background:#e9e7ef;color:#625879">SY</span>
                <div><div class="activity-top"><strong>SAFE</strong><span class="activity-time">22 juill. à 11:06</span></div><div class="activity-body">Échéance déplacée du 22 juillet au 23 juillet.</div></div>
              </div>

              <div class="comment-box">
                <div class="comment-placeholder">Ajouter un commentaire…</div>
                <div class="comment-actions"><button class="icon-btn" data-toast="Joindre un fichier"><svg class="icon icon-sm"><use href="#i-paperclip"/></svg></button><button class="send" data-toast="Commentaire ajouté">Envoyer</button></div>
              </div>
            </div>
          </article>

          <aside class="properties">
            <div class="prop-heading">Propriétés</div>
            <div class="prop-row"><span class="prop-label">Statut</span><span class="prop-value"><span class="prop-dot green"></span>En cours</span></div>
            <div class="prop-row"><span class="prop-label">Priorité</span><span class="prop-value"><span class="priority high"><i></i><i></i><i></i></span>Urgente</span></div>
            <div class="prop-row"><span class="prop-label">Responsable</span><span class="prop-value"><span class="avatar" style="width:18px;height:18px;font-size:8px">CR</span>Camille Roy</span></div>
            <div class="prop-row"><span class="prop-label">Client</span><span class="prop-value">Aaliyah Côté</span></div>
            <div class="prop-row"><span class="prop-label">Échéance</span><span class="prop-value">Aujourd’hui</span></div>
            <div class="prop-row"><span class="prop-label">Type</span><span class="prop-value"><span class="prop-dot purple"></span>Litige civil</span></div>
            <div class="prop-separator"></div>
            <div class="prop-heading">Temps et finances</div>
            <div class="prop-row"><span class="prop-label">Temps inscrit</span><span class="prop-value mono">14 h 35</span></div>
            <div class="prop-row"><span class="prop-label">Non facturé</span><span class="prop-value mono">3 840,00 $</span></div>
            <div class="prop-row"><span class="prop-label">Fidéicommis</span><span class="prop-value mono">18 500,00 $</span></div>
            <div class="prop-separator"></div>
            <div class="prop-heading">Documents <span style="margin-left:auto;color:var(--text-4);font-weight:450">3</span></div>
            <div class="file"><span class="file-type">PDF</span><span>Demande révisée<div class="file-meta">2,4 Mo · aujourd’hui</div></span></div>
            <div class="file"><span class="file-type">PDF</span><span>Pièces P-1 à P-6<div class="file-meta">8,1 Mo · hier</div></span></div>
            <div class="file"><span class="file-type" style="color:var(--blue)">DOC</span><span>Chronologie<div class="file-meta">184 Ko · 21 juill.</div></span></div>
          </aside>
        </div>
      </section>

      <section class="view" id="view-generic">
        <div class="list-toolbar"><div class="tabs"><button class="tab active" id="generic-tab">Vue d’ensemble</button></div></div>
        <div style="flex:1;display:grid;place-items:center;color:var(--text-4)">Cette vue suit la même grammaire d’interface dense et continue.</div>
      </section>
    </main>
  </div>
  <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

  <div class="toast" id="toast">Action</div>

  <script>
    const labels = {
      matters:"Dossiers", billing:"Facturation", trust:"Fidéicommis", search:"Recherche",
      inbox:"Navette", today:"Aujourd’hui", overview:"Vue d’ensemble", clients:"Clients",
      calendar:"Agenda", compliance:"Conformité", documents:"Documents", detail:"DOS-247"
    };
    const dedicated = new Set(["matters","today","billing","trust","detail"]);
    const views = [...document.querySelectorAll(".view")];
    const crumb = document.getElementById("current-crumb");
    const genericTab = document.getElementById("generic-tab");
    const topControls = document.querySelectorAll(".top-actions .hide-mobile, .create-main");
    const detailTimer = document.getElementById("detail-timer");
    const listFilter = document.getElementById("list-filter");
    const listDisplay = document.getElementById("list-display");
    const mobileNav = document.getElementById("mobile-nav");
    const mobileNavUse = document.getElementById("mobile-nav-use");
    const sidebar = document.querySelector(".sidebar");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");

    function showView(name) {
      const target = dedicated.has(name) ? document.getElementById("view-" + name) : document.getElementById("view-generic");
      views.forEach(view => view.classList.toggle("active", view === target));
      document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === name));
      crumb.textContent = labels[name] || "SAFE";
      if (!dedicated.has(name)) genericTab.textContent = labels[name] || "Vue d’ensemble";
      closePalette();
      detailTimer.style.display = name === "detail" ? "flex" : "none";
      listFilter.style.display = name === "detail" ? "none" : "";
      listDisplay.style.display = name === "detail" ? "none" : "";
      mobileNavUse.setAttribute("href", name === "detail" ? "#i-back" : "#i-menu");
      mobileNav.setAttribute("aria-label", name === "detail" ? "Retour aux dossiers" : "Ouvrir la navigation");
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("open");
      window.location.hash = name;
    }

    const palette = document.getElementById("palette");
    function openPalette() {
      palette.classList.add("open");
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("open");
      const input = document.getElementById("search-input");
      setTimeout(() => { input.focus(); input.select(); }, 30);
    }
    function closePalette() { palette.classList.remove("open"); }
    palette.addEventListener("click", event => { if (event.target === palette) closePalette(); });

    document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
      if (button.dataset.view === "search") openPalette(); else showView(button.dataset.view);
    }));
    document.querySelectorAll("[data-detail]").forEach(button => button.addEventListener("click", () => showView("detail")));
    document.querySelectorAll(".section-toggle").forEach(button => button.addEventListener("click", () => {
      button.classList.toggle("collapsed");
      document.getElementById(button.dataset.section + "-section").classList.toggle("hidden");
    }));
    document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
      [...tab.parentElement.children].forEach(item => item.classList.remove("active"));
      tab.classList.add("active");
    }));

    mobileNav.addEventListener("click", () => {
      if (document.getElementById("view-detail").classList.contains("active")) {
        showView("matters");
      } else {
        sidebar.classList.add("open");
        sidebarBackdrop.classList.add("open");
      }
    });
    sidebarBackdrop.addEventListener("click", () => {
      sidebar.classList.remove("open");
      sidebarBackdrop.classList.remove("open");
    });

    const searchInput = document.getElementById("search-input");
    const searchRows = [...document.querySelectorAll(".search-result")];
    const searchEmpty = document.getElementById("search-empty");
    const resultsTitle = document.getElementById("results-title");
    let activeFilter = "all";
    function updateSearch() {
      const query = searchInput.value.trim().toLocaleLowerCase("fr");
      let visible = 0;
      searchRows.forEach(row => {
        const matchesQuery = !query || row.dataset.search.includes(query);
        const matchesFilter = activeFilter === "all" || row.dataset.kind === activeFilter;
        row.hidden = !(matchesQuery && matchesFilter);
        if (!row.hidden) visible += 1;
      });
      resultsTitle.textContent = query ? "Résultats" : "Récemment consultés";
      searchEmpty.classList.toggle("visible", visible === 0);
    }
    searchInput.addEventListener("input", updateSearch);
    document.querySelectorAll(".search-filter").forEach(filter => filter.addEventListener("click", () => {
      document.querySelectorAll(".search-filter").forEach(item => item.classList.remove("active"));
      filter.classList.add("active");
      activeFilter = filter.dataset.filter;
      updateSearch();
      searchInput.focus();
    }));

    const toast = document.getElementById("toast");
    let toastTimer;
    document.querySelectorAll("[data-toast]").forEach(button => button.addEventListener("click", event => {
      event.stopPropagation();
      toast.textContent = button.dataset.toast;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
    }));

    function moveCursor(step) {
      const rows = searchRows.filter(row => !row.hidden);
      if (!rows.length) return;
      let index = rows.findIndex(row => row.classList.contains("cursor"));
      rows.forEach(row => row.classList.remove("cursor"));
      index = (index + step + rows.length) % rows.length;
      rows[index].classList.add("cursor");
      rows[index].scrollIntoView({block:"nearest"});
    }
    document.addEventListener("keydown", event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        palette.classList.contains("open") ? closePalette() : openPalette();
        return;
      }
      if (!palette.classList.contains("open")) return;
      if (event.key === "Escape") { closePalette(); return; }
      if (event.key === "ArrowDown") { event.preventDefault(); moveCursor(1); }
      if (event.key === "ArrowUp") { event.preventDefault(); moveCursor(-1); }
      if (event.key === "Enter") {
        const current = searchRows.find(row => row.classList.contains("cursor") && !row.hidden);
        (current || searchRows.find(row => !row.hidden))?.click();
      }
    });

    const assigneeTints = { ML:{bg:"#eee9df",fg:"#785f34"}, SB:{bg:"#e9e7ef",fg:"#625879"} };
    const rowAssignee = { "DOS-251":"ML","DOS-238":"ML","DOS-198":"ML","DOS-205":"SB","DOS-184":"SB","FAC-172":"ML","FID-039":"ML" };
    document.querySelectorAll(".issue-row").forEach(row => {
      const ref = (row.querySelector(".ref")?.textContent || "").trim();
      const code = rowAssignee[ref] || "CR";
      const avatar = document.createElement("span");
      avatar.className = "row-avatar";
      avatar.textContent = code;
      const tint = assigneeTints[code];
      if (tint) { avatar.style.background = tint.bg; avatar.style.color = tint.fg; }
      row.insertBefore(avatar, row.querySelector(".row-menu"));
    });

    const initial = window.location.hash.replace("#","") || "matters";
    if (labels[initial]) showView(initial);
    window.addEventListener("hashchange", () => {
      const next = window.location.hash.replace("#","");
      if (labels[next]) showView(next);
    });
  </script>
</body>
</html>
```
