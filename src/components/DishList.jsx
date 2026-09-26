import { Header, SpeakButton, Spice } from './ui'

function DishCard({ dish, onOrder }) {
  return (
    <article className="rounded-3xl bg-white border border-amber-200 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="thai text-2xl font-bold text-amber-950">{dish.thai_name}</h2>
            {dish.verified && (
              <span
                title={dish.verified === 'exact' ? 'From our checked dish list' : 'Tips and story from our checked dish list'}
                className="text-[11px] font-semibold uppercase tracking-wide bg-sky-100 text-sky-800 rounded-full px-2 py-0.5"
              >✓ Dish list</span>
            )}
            {dish.northern_specialty && (
              <span className="text-[11px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5">⭐ Northern</span>
            )}
          </div>
          <p className="text-amber-700 italic">{dish.romanized}</p>
          <p className="font-semibold text-amber-950">{dish.english_name}{dish.price ? <span className="font-normal text-amber-700"> · {dish.price}</span> : null}</p>
        </div>
        <SpeakButton text={dish.thai_name} />
      </div>

      <p className="text-amber-950">{dish.description}</p>

      <div className="flex flex-wrap gap-1.5 items-center">
        {dish.ingredients?.map((i) => (
          <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-full px-2 py-1">{i}</span>
        ))}
        <span className="ml-auto"><Spice level={dish.spice_level} /></span>
      </div>

      {dish.how_to_eat && (
        <p className="text-sm bg-amber-50 rounded-2xl p-3 text-amber-900"><b>How locals eat it:</b> {dish.how_to_eat}</p>
      )}
      {dish.story && <p className="text-sm text-amber-800">📖 {dish.story}</p>}

      <button
        onClick={() => onOrder(dish)}
        className="mt-1 rounded-2xl bg-amber-700 hover:bg-amber-800 active:scale-[0.98] transition text-white py-3 font-bold"
      >Order this in Thai →</button>
    </article>
  )
}

export default function DishList({ dishes, onBack, onOrder, preview }) {
  return (
    <div className="min-h-screen">
      <Header title={`${dishes.length} dishes found`} onBack={onBack} />
      <main className="px-4 py-4 flex flex-col gap-4 max-w-md mx-auto pb-10">
        {preview && <img src={preview} alt="Scanned menu" className="rounded-2xl max-h-40 object-cover w-full" />}
        {dishes.length === 0 && <p className="text-center text-amber-800 py-10">No dishes recognised. Try a clearer photo.</p>}
        {dishes.map((d) => <DishCard key={d.id} dish={d} onOrder={onOrder} />)}
      </main>
    </div>
  )
}
