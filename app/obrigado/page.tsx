export default function ThankYou() {
  const number = process.env.NEXT_PUBLIC_VICTOR_WHATSAPP;
  const whatsapp = number ? `https://wa.me/${number}?text=${encodeURIComponent("Olá! Acabei de enviar uma solicitação pelo site da HS Representações e gostaria de continuar o atendimento.")}` : null;
  return <main className="thank-you"><div className="thank-you-card"><p className="eyebrow">SOLICITAÇÃO RECEBIDA</p><h1>Obrigado. Vamos olhar seu caso com cuidado.</h1><p>Suas informações chegaram ao time da HS Representações. Um especialista entrará em contato pelo WhatsApp informado.</p>{whatsapp && <a className="button button-primary" href={whatsapp} target="_blank" rel="noreferrer">Falar com o Victor agora</a>}<a className="back-link" href="/">Voltar para o site</a></div></main>;
}
