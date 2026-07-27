"use client";

import { useEffect, useMemo, useState } from "react";

type Person = { id: string; name: string; paid: boolean };
type LunchDay = { id: string; date: string; attendees: string[] };
type Store = { price: number; people: Person[]; days: LunchDay[] };

const initial: Store = {
  price: 7000,
  people: [
    { id: "a", name: "A", paid: false },
    { id: "b", name: "B", paid: false },
    { id: "c", name: "C", paid: false },
    { id: "d", name: "D", paid: false },
  ],
  days: [
    { id: "0715", date: "2026-07-15", attendees: ["a", "b", "c"] },
    { id: "0716", date: "2026-07-16", attendees: ["a", "b", "c"] },
    { id: "0720", date: "2026-07-20", attendees: ["a", "b", "c", "d"] },
    { id: "0722", date: "2026-07-22", attendees: ["a", "b", "d"] },
    { id: "0724", date: "2026-07-24", attendees: ["a", "b", "d"] },
  ],
};

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const dayText = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(
    new Date(`${date}T12:00:00`),
  );

export default function Home() {
  const [store, setStore] = useState<Store>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lunch-ledger-v1");
    if (saved) {
      try {
        setStore(JSON.parse(saved));
      } catch {}
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("lunch-ledger-v1", JSON.stringify(store));
  }, [store, ready]);

  const totalMeals = useMemo(
    () => store.days.reduce((sum, day) => sum + day.attendees.length, 0),
    [store.days],
  );
  const counts = Object.fromEntries(
    store.people.map((person) => [
      person.id,
      store.days.filter((day) => day.attendees.includes(person.id)).length,
    ]),
  );

  const toggle = (dayId: string, personId: string) =>
    setStore((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              attendees: day.attendees.includes(personId)
                ? day.attendees.filter((id) => id !== personId)
                : [...day.attendees, personId],
            },
      ),
    }));

  const addDay = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStore((prev) => ({
      ...prev,
      days: [...prev.days, { id: crypto.randomUUID(), date: today, attendees: [] }],
    }));
  };

  const addPerson = () =>
    setStore((prev) => ({
      ...prev,
      people: [
        ...prev.people,
        { id: crypto.randomUUID(), name: `사람 ${prev.people.length + 1}`, paid: false },
      ],
    }));

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">우리 점심 정산</p>
          <h1>도시락 장부</h1>
          <p className="sub">먹은 날만 체크하면 낼 돈이 바로 계산돼요.</p>
        </div>
        <label className="price">
          <span>한 끼 가격</span>
          <div>
            <input
              aria-label="한 끼 가격"
              type="number"
              min="0"
              step="500"
              value={store.price}
              onChange={(e) => setStore({ ...store, price: Number(e.target.value) })}
            />
            <b>원</b>
          </div>
        </label>
      </header>

      <section className="summary" aria-label="이번 달 요약">
        <div><span>총 도시락</span><strong>{totalMeals}<small>개</small></strong></div>
        <div><span>총 결제금액</span><strong>{won(totalMeals * store.price)}</strong></div>
        <div><span>입금 완료</span><strong>{store.people.filter((p) => p.paid).length}<small> / {store.people.length}명</small></strong></div>
      </section>

      <section className="card attendance">
        <div className="section-head">
          <div><h2>날짜별 식사 체크</h2><p>먹은 사람의 칸을 눌러주세요.</p></div>
          <button className="outline" onClick={addDay}>＋ 날짜 추가</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                {store.people.map((person) => <th key={person.id}>{person.name}</th>)}
                <th>수량</th><th></th>
              </tr>
            </thead>
            <tbody>
              {store.days.map((day) => (
                <tr key={day.id}>
                  <td>
                    <input
                      className="date-input"
                      type="date"
                      value={day.date}
                      aria-label="식사 날짜"
                      onChange={(e) => setStore({ ...store, days: store.days.map((d) => d.id === day.id ? { ...d, date: e.target.value } : d) })}
                    />
                    <span className="pretty-date">{dayText(day.date)}</span>
                  </td>
                  {store.people.map((person) => {
                    const checked = day.attendees.includes(person.id);
                    return (
                      <td key={person.id}>
                        <button
                          className={`check ${checked ? "on" : ""}`}
                          aria-label={`${day.date} ${person.name} 식사 ${checked ? "취소" : "추가"}`}
                          aria-pressed={checked}
                          onClick={() => toggle(day.id, person.id)}
                        >{checked ? "✓" : ""}</button>
                      </td>
                    );
                  })}
                  <td><b className="qty">{day.attendees.length}개</b></td>
                  <td><button className="delete" aria-label="날짜 삭제" onClick={() => setStore({ ...store, days: store.days.filter((d) => d.id !== day.id) })}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card settlement">
        <div className="section-head">
          <div><h2>개인별 정산</h2><p>입금받으면 완료로 바꿔주세요.</p></div>
          <button className="outline" onClick={addPerson}>＋ 사람 추가</button>
        </div>
        <div className="people">
          {store.people.map((person) => (
            <article key={person.id} className={person.paid ? "paid" : ""}>
              <div className="person-top">
                <div className="avatar">{person.name.slice(0, 1)}</div>
                <input
                  aria-label="이름"
                  value={person.name}
                  onChange={(e) => setStore({ ...store, people: store.people.map((p) => p.id === person.id ? { ...p, name: e.target.value } : p) })}
                />
                <button className="delete" aria-label={`${person.name} 삭제`} onClick={() => setStore({ ...store, people: store.people.filter((p) => p.id !== person.id), days: store.days.map((d) => ({ ...d, attendees: d.attendees.filter((id) => id !== person.id) })) })}>×</button>
              </div>
              <div className="bill"><span>{counts[person.id]}번 × {won(store.price)}</span><strong>{won(counts[person.id] * store.price)}</strong></div>
              <button
                className="pay-button"
                onClick={() => setStore({ ...store, people: store.people.map((p) => p.id === person.id ? { ...p, paid: !p.paid } : p) })}
              >{person.paid ? "✓ 입금 완료" : "입금 대기"}</button>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <span>내용은 이 기기에 자동 저장됩니다.</span>
        <button onClick={() => { if (confirm("처음 기록으로 되돌릴까요?")) setStore(initial); }}>처음 기록으로 되돌리기</button>
      </footer>
    </main>
  );
}
