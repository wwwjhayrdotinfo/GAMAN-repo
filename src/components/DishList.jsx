import Icon from './Icon'
import { Header, SpeakButton, Spice } from './ui'

function DishCard({ dish, onOrder }) {
  return (
    <article className="rounded-3xl bg-white border border-line shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="thai text-2xl font-bold text-ink">{dish.thai_name}</h2>
            {dish.verified && (
              <span
                title={dish.verified === 'exact' ? 'From our checked dish list' : 'Tips and story from our checked dish list'}
                className="text-[11px] font-semibold uppercase tracking-wide bg-soft text-ink rounded-full px-2 py-0.5"
              >✓ Dish list</span>
            )}
            {dish.northern_specialty && (
              <span className="text-[11px] font-semibold uppercase tracking-wide bg-leaf-soft text-leaf rounded-full px-2 py-0.5">Northern</span>
            )}
          </div>
          <p className="text-ink italic">{dish.romanized}</p>
          <p className="font-semibold text-ink">{dish.english_name}{dish.price ? <span className="font-normal text-ink"> · {dish.price}</span> : null}</p>
        </div>
        <SpeakButton text={dish.thai_name} />
      </div>

      {dish.pending ? (
        <button
          type="button"
          onClick={() => dish.loadDetails?.()}
          className="rounded-2xl border border-line bg-rice py-3 font-semibold text-ink active:scale-[0.98] transition"
        >Show details and order →</button>
      ) : dish.loading || dish.detailError ? (
        <div role="status" className="rounded-2xl bg-rice p-3 text-sm text-ink">
          {dish.detailError ? (
            <span className="flex items-center gap-2">{dish.detailError}
              {dish.loadDetails && <button type="button" onClick={() => dish.loadDetails()} className="ml-auto underline font-semibold">Try again</button>}
            </span>
          ) : <><div className="animate-pulse h-3 bg-line rounded mb-2" /><div className="animate-pulse h-3 bg-line rounded w-2/3 mb-2" />Loading dish details…</>}
        </div>
      ) : <>
      <p className="text-ink">{dish.description}</p>

      <div className="flex flex-wrap gap-1.5 items-center">
        {dish.ingredients?.map((i) => (
          <span key={i} className="text-xs bg-rice border border-line text-ink rounded-full px-2 py-1">{i}</span>
        ))}
        <span className="ml-auto"><Spice level={dish.spice_level} /></span>
      </div>

      {dish.how_to_eat && (
        <p className="text-sm bg-rice rounded-2xl p-3 text-ink"><b>How locals eat it:</b> {dish.how_to_eat}</p>
      )}
      {dish.story && <p className="text-sm text-ink"><Icon name="book" size={16} className="mr-1 align-middle" /> {dish.story}</p>}

      <button
        onClick={() => onOrder(dish)}
        className="mt-1 rounded-2xl bg-action hover:bg-action-hover active:scale-[0.98] transition text-white py-3 font-bold"
      >Order this in Thai →</button>
      </>}
    </article>
  )
}

export default function DishList({ dishes, onBack, onOrder, preview }) {
  return (
    <div className="min-h-screen">
      <Header title={`${dishes.length} dishes found`} onBack={onBack} />
      <main className="px-4 py-4 flex flex-col gap-4 max-w-md mx-auto pb-10">
        {preview && <img src={preview} alt="Scanned menu" className="rounded-2xl max-h-40 object-cover w-full" />}
        {dishes.some((dish) => dish.loading) && <p role="status" className="text-sm text-ink">{dishes.filter((dish) => !dish.loading && !dish.detailError && !dish.pending).length} of {dishes.length} dishes ready. You can order any ready dish.</p>}
        {dishes.length === 0 && <p className="text-center text-ink py-10">No dishes recognised. Try a clearer photo.</p>}
        {dishes.map((d) => <DishCard key={d.id} dish={d} onOrder={onOrder} />)}
      </main>
    </div>
  )
}
