// ---------------------------------------------------------
// Sākam ar react komponentu definīcijām. Bez redux, bez nekā cita.

import React, { Component } from 'react'

// Vienkāršs react komponents: extendo `Component` klasi, implementē `render` metodi, saņem datus caur properties
class Status extends Component {
  render() {
    // ES6 destructuring - uztaisa atsevišķus mainīgos no objekta key'iem. Lai nav jāraksta `this.props.` visur.
    const { sum, pluses, minuses } = this.props

    return <div>
      <strong>Total: {sum}</strong>
      <div>+ clicks: {pluses}</div>
      <div>- clicks: {minuses}</div>
    </div>
  }
}

// Ja komponents nedara neko vairāk par propertiju pārvēršanu markup'ā, to var definēt kā vienkāršu klasi
const Button = ({ text, onClick }) => <button type="button" onClick={onClick}>{text}</button>

class App extends Component {
  render() {
    const { add, addLots, subtract } = this.props

    // ES6 spread - pretējais destructuring, "atver" objektu. Atkal, lai nebūtu daudz jāraksta.
    // <Status { ...{ a: 1, b: 2} } == <Status a={1} b={2} />
    const status = <Status {...this.props} />

    return <div>
      {status}
      <Button text="+" onClick={add} />
      <Button text="++" onClick={addLots} />
      <Button text="-" onClick={subtract} />
    </div>
  }
}

// ---------------------------------------------------------
// Līdz šim viss ir bijis tīrs `react`. Pievienojam `redux`:

// Sākotnējais app'ai vajadzīgo datu stāvoklis.
const initialState = {
  sum: 0,
  pluses: 0,
  minuses: 0
}

// Redux reuducer. Funkcija, kas saņem šī brīža datu modeli un pieprasītās modifikācijas aprakstu.
// Atgriež datu modeli kādam tam jābūt pēc modifikācijas.
// ES6 default vērtība pirmajam parametram.
function reducer(state = initialState, action) {
  // Convention, ka action ir divi keyi - `type` kas apzīmē veicamo darbību un `payload` kurā ielikt vajadzīgos parametrus
  const { type, payload } = action

  console.log("Pieprasītas izmaiņas store: ", action)

  switch (type) {
    case 'PLUS':
      // Ar spread operatoru izveidojam jaunu objektu, kas satur visus vecā state keyus, un papildus norādītos
      // Ja gan vecajā state gan papildus parametros ir keys `pluses`, uzvar tas ko norāda pēdējo
      // { pluses: state.pluses + 1, ...state } vienmēr atgrieztu veco `pluses` vērtību
      return { ...state, pluses: state.pluses + 1, sum: state.sum + payload }
    case 'MINUS':
      return { ...state, minuses: state.minuses + 1, sum: state.sum - payload }
    case 'RESET':
      return initialState
    default:
      // Reducer funkcijai vienmēr jāatgriež dati. Ja nezinam ko iesākt ar action, atgriežam to kas bija iepriekš.
      return state
  }
}

// Redux store objekts. Var uzskatīt par datubāzi - atbild par lasīšanu / rakstīšanu datu modelī.
import { createStore } from 'redux'

const store = createStore(reducer)

// Store nav obligāti jālieto kopār ar react komponentu.
// Ar `subscribe` pievieno listener funkciju, kas tiek izsaukta katrreiz, kad mainās store saturs.
store.subscribe(() => {
  // Ar `getState` iegūst datus kādi tie ir izsaukšanas brīdī
  const state = store.getState()
  console.log("Izmainītais store saturs: ", state)
})

setTimeout(() => {
  // `dispatch` nosūta izmaiņu pieprasījumu storei. Padotais objekts nonāk reducer funkcijā kā action parametrs.
  store.dispatch({ type: 'UNHANDLED_ACTION', payload: { randomNumber: Math.random() } })
}, 2000)

// ---------------------------------------------------------
// react-redux ir helperi, kas paredzēti redux store vieglākai savienošanai ar react komponentiem
import { connect, Provider } from 'react-redux'

// Veids kā sasaistīt store datus ar react komponenta properties
// Saņem store saturu, atgriež propertijus ko padot komponentam
const mapStateToProps = (state) => {
  return {
    pluses: state.pluses,
    minuses: state.minuses,
    sum: state.sum
  }
}

// Veids kā atļaut react komponentam pieprasīt modifikācijas storē.
// Saņem `dispatch` funkciju, atgriež callbackus ko izsaukt komponentā. Arī tiek padoti kā properties.
// Komponentā pa taisno neizsauc `store.dispatch`, lai tie nebūtu piesieti pie `redux`.
// Komponentam pat nav jāzin ka tāds store vispār ir - saņem datus un callbackus caur properties, strādā tikai ar tiem.
const mapDispatchToProps = (dispatch) => {
  return {
    add: () => dispatch({ type: 'PLUS', payload: 1 }),
    addLots: () => dispatch({ type: 'PLUS', payload: 10 }),
    subtract: () => dispatch({ type: 'MINUS', payload: 1 })
  }
}

// Tīrais <App /> komponets tiek iewrapots tā, lai mācētu sazināties ar redux store.
// Saņem informāciju par to, kādus datus / funkcijas padot wrapotajam komponentam kā propertijus.
const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App)

// Vienā app'ā var būt daudzi connected komponenti, kas mijiedarbojas ar to pašu store
const ResetButton = connect(
  (state) => { return {} },
  (dispatch) => { return { onClick: () => { dispatch({ type: 'RESET' }) } } }
)(Button)

// Lai connected komponenti varētu piekļūt storei, tiem jābūt iekš <Provider /> komponenta. Salīdzīnāms ar DB adapteri.
// Zem viena <Provider /> var būt vairāki connected komponenti.
const renderables = <Provider store={store}>
  <div data-comment="Provider sagaida ka tajā būs tikai viens tiešais child komponents, tāpēc wrappojam div'ā">
    <ConnectedApp />
    <div data-comment="connected komponentam nav jābūt uzreiz zem Provider, var būt nestots cik dziļi gribi">
      <ResetButton text="Reset" data-comment="connected komponentiem var būt arī parasti propertiji, visus apvieno kopā"/>
    </div>
  </div>
</Provider>

// ---------------------------------------------------------
// Visbeidzot, pasakam react lai renderē app'u un rezultātu ieliek dokumentā.
// redux connected komponentu renderēšana ne ar ko neatšķiras no 'tīra' react renderēšanas.
import { render } from 'react-dom'

render(renderables, document.getElementById('root'))
