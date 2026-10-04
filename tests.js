/* Opt-in browser regression tests: open index.html?test=1. */
if(new URLSearchParams(location.search).has('test')) {
  addEventListener('load', async()=>{
    const failures=[],errors=[];
    addEventListener('error',e=>errors.push(e.message));
    const check=(ok,s)=>{if(!ok)failures.push(s);};
    const setup=ids=>{const b=new JokerEngine.Battle(JokerDefaultCounts);b.players[0].hand=[...ids];b.players[0].energy=20;return b;};
    let b=setup([0]);b.players[1].shield=6;b.play(0);check(b.players[1].hp===99&&b.players[1].shield===0,'shield');
    b=setup([4]);b.players[1].shield=6;b.play(0);check(b.players[1].hp===98,'shield stripping');
    b=setup([5,6]);b.players[0].hp=80;b.play(0);b.play(0);check(b.players[0].hp===82&&b.players[0].shield===12,'defense combo');b.end();check(b.players[0].shield===12,'persistent shield');
    b=setup([11,5,5]);b.players[0].hp=99;b.play(0);b.play(0);b.play(0);check(b.players[0].hp===100&&b.players[0].shield===13,'heal cap and one-use boost');
    b=setup([2,0]);b.players[0].weak_any=4;b.players[0].weak_physical=3;b.play(0);check(b.players[0].weak_physical===3,'physical debuff survives magic');b.play(0);check(b.players[1].hp===94,'debuff consumption');
    b=setup([0]);b.players[0].energy=0;check(!b.play(0),'energy cost');b.players[0].hp=0;b.check();check(!b.finished,'0 hp continues');
    let minHP=100;
    for(const nature of ['Água','Fogo','Terra','Vento'])for(let run=0;run<50;run++){
      b=new JokerEngine.Battle(JokerDefaultCounts,nature);let steps=0;
      while(!b.finished&&steps++<1000){for(const p of b.players){check(p.deck.length+p.hand.length+p.discard.length===30,'card conservation');check(p.hp>=0&&p.hp<=100&&p.shield>=0,'valid state');minHP=Math.min(minHP,p.hp);}const i=b.choice();i<0?b.end():b.play(i);}
      check(b.finished,'200 matches finish');check(b.players.every(p=>p.hand.length===0&&p.deck.length===0),'exhaustion');
    }
    check(JokerCards.length===12&&!JokerCards.some(c=>c.id==='uiara'),'Uiara removed');
    JokerUI.menu();check(!!document.querySelector('[data-action="rules"]'),'explanation menu button');
    document.querySelector('[data-action="rules"]').click();check(JokerUI.screen==='rules'&&document.body.textContent.includes('Como jogar'),'explanation screen');
    JokerUI.builder();check(document.querySelectorAll('.catalog article').length===12,'12 builder cards');
    check(document.documentElement.scrollWidth<=innerWidth+2,'responsive builder width');
    JokerUI.start();check(document.querySelectorAll('.hand-card').length===6,'initial hand');
    document.querySelector('.hand-card').click();check(!!document.querySelector('[data-action="play"]'),'touch selection and play control');
    check(document.documentElement.scrollWidth<=innerWidth+2,'responsive battle width');
    await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    const broken=[...document.images].filter(i=>i.complete&&i.naturalWidth===0);check(!broken.length,'sprite load');
    const result={failures,errors,matches:200,minHP,width:innerWidth,screen:JokerUI.screen};
    await fetch('/__test_result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});
    const banner=document.createElement('div');banner.id='test-result';banner.textContent=failures.length||errors.length?'TEST FAILED: '+JSON.stringify(result):`PASS: 200 duels + effects + UI at ${innerWidth}px`;banner.style.cssText='position:fixed;bottom:0;left:0;z-index:99;background:#164b35;color:white;padding:8px;font:14px monospace';document.body.append(banner);
  });
}
