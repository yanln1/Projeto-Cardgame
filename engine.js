/* Rule engine: same 12 Water cards and rules as the Godot prototype. */
(() => {
  const cards = window.JokerCards;
  const strong = {'Água':'Fogo','Fogo':'Terra','Terra':'Vento','Vento':'Água'};
  function valid(counts) { return Array.isArray(counts) && counts.length === 12 && counts.every(n => Number.isInteger(n) && n >= 1 && n <= 6) && counts.reduce((a,b)=>a+b,0) === 30; }
  function shuffle(a) { for(let i=a.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
  class Battle {
    constructor(counts, nature='Água') {
      if(!valid(counts)) throw new Error('O deck deve ter exatamente 30 cartas.');
      this.turn=0; this.round=1; this.finished=false; this.winner=-1; this.history=[];
      this.players=[counts,window.JokerDefaultCounts].map((composition,who)=>({hp:100,shield:0,deck:shuffle(composition.flatMap((n,id)=>Array(n).fill(id))),hand:[],discard:[],energy:0,bank:0,weak_any:0,weak_physical:0,boost:0,defenses:0,nature:who===0?nature:'Água'}));
      this.players.forEach((_,i)=>this.refill(i)); this.begin(); this.log('O duelo começou. Preserve seu HP até os dois decks acabarem.');
    }
    name(i) {return i===0?'Você':'Xamã das Águas';}
    log(s) {this.history.push(s); if(this.history.length>100)this.history.shift();}
    refill(i) {const p=this.players[i];while(p.hand.length<6&&p.deck.length)p.hand.push(p.deck.pop());}
    begin() {this.refill(this.turn);const p=this.players[this.turn];p.energy=4+p.bank;p.bank=0;p.defenses=0;}
    exhausted(i) {const p=this.players[i];return !p.deck.length&&!p.hand.length;}
    check() {if(this.exhausted(0)&&this.exhausted(1)){this.finished=true;this.winner=this.players[0].hp===this.players[1].hp?-1:(this.players[0].hp>this.players[1].hp?0:1);this.log('Os dois decks foram esgotados.');}}
    canPlay(index) {const p=this.players[this.turn];return !this.finished&&index>=0&&index<p.hand.length&&cards[p.hand[index]].cost<=p.energy;}
    multiplier(a,d) {return strong[a]===d?1.25:strong[d]===a?.75:1;}
    play(index) {
      if(!this.canPlay(index))return false;
      const p=this.players[this.turn],e=this.players[1-this.turn],id=p.hand.splice(index,1)[0],c=cards[id],details=[];
      p.energy-=c.cost;p.discard.push(id);
      if(c.strip){const removed=Math.min(e.shield,c.strip);e.shield-=removed;details.push(`removeu ${removed} Escudo`);}
      if(c.damage){let damage=Math.round(c.damage*this.multiplier('Água',e.nature))-p.weak_any;p.weak_any=0;if(c.physical){damage-=p.weak_physical;p.weak_physical=0;}damage=Math.max(0,damage);const absorbed=Math.min(e.shield,damage);e.shield-=absorbed;const lost=Math.min(e.hp,damage-absorbed);e.hp-=lost;details.push(`${damage} dano (${absorbed} Escudo / ${lost} HP)`);}
      if(c.shield){const shield=c.shield+p.boost;p.boost=0;p.shield+=shield;p.defenses++;details.push(`+${shield} Escudo`);if(p.defenses===2){const recovered=Math.min(2,100-p.hp);p.hp+=recovered;details.push(`combo: +${recovered} HP`);}}
      if(c.heal){const healed=Math.min(c.heal,100-p.hp);p.hp+=healed;details.push(`+${healed} HP`);}
      for(const key of ['weak_any','weak_physical'])if(c[key]){e[key]+=c[key];details.push(`próximo ataque${key==='weak_physical'?' físico':''}: -${c[key]}`);}
      if(c.boost){p.boost+=c.boost;details.push(`próxima Defesa: +${c.boost}`);}
      this.log(`${this.name(this.turn)} · ${c.name}: ${details.join('; ')}.`);this.check();return true;
    }
    end() {if(this.finished)return;const p=this.players[this.turn];p.bank=Math.min(2,p.energy);this.log(`${this.name(this.turn)} guardou ${p.bank} energia.`);this.check();if(this.finished)return;this.turn=1-this.turn;if(this.exhausted(this.turn))this.turn=1-this.turn;if(this.turn===0)this.round++;this.begin();}
    choice() {
      const p=this.players[this.turn],e=this.players[1-this.turn];let best=-1,highest=-Infinity;
      p.hand.forEach((id,index)=>{if(!this.canPlay(index))return;const c=cards[id];let v=(c.damage||0)+(c.shield||0)*.8+Math.min(c.heal||0,100-p.hp)+Math.min(c.strip||0,e.shield)+(c.weak_any||0)*.7+(c.weak_physical||0)*.5+(c.boost||0)*.8;if(c.shield&&p.defenses===1)v+=2;v/=c.cost;if(v>highest){highest=v;best=index;}});return best;
    }
    botStep() {if(this.finished||this.turn!==1)return;const choice=this.choice();if(choice<0)this.end();else this.play(choice);}
  }
  window.JokerEngine={Battle,valid};
})();
