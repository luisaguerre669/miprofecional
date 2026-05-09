export default function App() {
  return (
    <div style={{fontFamily:'Arial'}}>

      <header style={{
        display:'flex',
        justifyContent:'space-between',
        padding:'15px',
        background:'#0d6efd',
        color:'white'
      }}>
        <h2>MiProfesional</h2>
        <div>
          <button>Descargar App</button>
          <button>Registrarse</button>
        </div>
      </header>

      <section style={{
        padding:'60px',
        textAlign:'center',
        background:'linear-gradient(135deg,#0d6efd,#00c2ff)',
        color:'white'
      }}>
        <h1>Encontrá profesionales cerca tuyo</h1>
        <p>Conectamos clientes con especialistas en segundos</p>
        <button>Empezar ahora</button>
      </section>

      <section style={{padding:'20px'}}>
        <h2>Servicios</h2>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(3,1fr)',
          gap:'10px'
        }}>

          <Card title="Construcción" items={["Electricista","Plomero","Gasista","Albañil"]}/>
          <Card title="Salud" items={["Médicos","Enfermeros","Terapeutas"]}/>
          <Card title="Belleza" items={["Peluquería","Estética"]}/>
          <Card title="Hogar" items={["Limpieza","Jardinería"]}/>
          <Card title="Mascotas" items={["Veterinario","Paseador"]}/>
          <Card title="Legal" items={["Abogados"]}/>

        </div>
      </section>

      <section style={{
        margin:'20px',
        height:'200px',
        background:'#ddd',
        display:'flex',
        alignItems:'center',
        justifyContent:'center'
      }}>
        Mapa: Cliente &lt;-&gt; Profesional
      </section>

      <footer style={{
        textAlign:'center',
        padding:'20px',
        fontSize:'12px'
      }}>
        MiProfesional conecta usuarios. No se responsabiliza por trabajos o pagos.
      </footer>

    </div>
  )
}

function Card({title,items}:{title:string,items:string[]}) {
  return (
    <div style={{
      background:'white',
      padding:'15px',
      borderRadius:'10px',
      boxShadow:'0 2px 6px rgba(0,0,0,0.1)'
    }}>
      <h3>{title}</h3>
      <ul>
        {items.map((i,idx)=><li key={idx}>{i}</li>)}
      </ul>
    </div>
  )
}
