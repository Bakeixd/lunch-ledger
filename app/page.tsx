"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Person = { id: string; name: string; paid: boolean };
type LunchDay = { id: string; date: string; attendees: string[]; complimentary?: boolean };
type Company = { id: string; name: string; price: number; people: Person[]; days: LunchDay[] };
type AppState = { companies: Company[] };

const seed: AppState = {
  companies: [{
    id: "ondam",
    name: "온담도시락",
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
  }],
};

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const prettyDate = (date: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" })
    .format(new Date(`${date}T12:00:00`));

export default function Home() {
  const [data, setData] = useState<AppState>(seed);
  const [activeId, setActiveId] = useState("ondam");
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<"saving" | "saved" | "offline">("saving");
  const [newLunchDate, setNewLunchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((value: AppState) => {
        if (value.companies?.length) {
          setData(value);
          setActiveId(value.companies[0].id);
        }
        setSync("saved");
      })
      .catch(() => {
        const local = localStorage.getItem("lunch-settlement-v2");
        if (local) {
          try { setData(JSON.parse(local)); } catch {}
        }
        setSync("offline");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("lunch-settlement-v2", JSON.stringify(data));
    setSync("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error();
        setSync("saved");
      }).catch(() => setSync("offline"));
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, ready]);

  const company = data.companies.find((item) => item.id === activeId) ?? data.companies[0];
  const updateCompany = (change: (current: Company) => Company) =>
    setData((prev) => ({
      companies: prev.companies.map((item) => item.id === company.id ? change(item) : item),
    }));

  const totalMeals = useMemo(
    () => company.days.reduce((sum, day) => sum + day.attendees.length, 0),
    [company],
  );
  const chargeableMeals = useMemo(
    () => company.days.reduce(
      (sum, day) => sum + (day.complimentary ? 0 : day.attendees.length),
      0,
    ),
    [company],
  );
  const counts = Object.fromEntries(company.people.map((person) => [
    person.id,
    company.days.filter((day) => day.attendees.includes(person.id)).length,
  ]));
  const chargeableCounts = Object.fromEntries(company.people.map((person) => [
    person.id,
    company.days.filter(
      (day) => !day.complimentary && day.attendees.includes(person.id),
    ).length,
  ]));

  const addCompany = () => {
    const name = prompt("업체 이름을 입력해 주세요.");
    if (!name?.trim()) return;
    const id = crypto.randomUUID();
    setData((prev) => ({
      companies: [...prev.companies, { id, name: name.trim(), price: 7000, people: [], days: [] }],
    }));
    setActiveId(id);
  };

  const addLunchDay = () => {
    if (!newLunchDate) return;
    updateCompany((current) => ({
      ...current,
      days: [
        ...current.days,
        {
          id: crypto.randomUUID(),
          date: newLunchDate,
          attendees: [],
        },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  };

  return (
    <main>
      <nav className="topbar">
        <div className="brand">
          <span className="brand-icon"><img src="data:image/png;base64,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" alt="" /></span>
          점심정산
        </div>
        <div className={`sync ${sync}`}>
          <i /> {sync === "saved" ? "모두 저장됨" : sync === "saving" ? "저장 중" : "기기 저장 중"}
        </div>
      </nav>

      <section className="hero">
        <div className="mesh" />
        <p className="eyebrow">LUNCH SETTLEMENT</p>
        <p>업체별 주문 기록부터 개인별 입금 확인까지 한곳에서 관리합니다.</p>
      </section>

      <section className="workspace">
        <div className="tabs" role="tablist" aria-label="도시락 업체">
          {data.companies.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={item.id === company.id}
              className={item.id === company.id ? "active" : ""}
              onClick={() => setActiveId(item.id)}
            >{item.name}</button>
          ))}
          <button className="add-tab" onClick={addCompany}>＋ 업체 추가</button>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CURRENT COMPANY</p>
              <input
                className="company-name"
                aria-label="업체 이름"
                value={company.name}
                onChange={(e) => updateCompany((c) => ({ ...c, name: e.target.value }))}
              />
            </div>
            <label className="price-editor">
              <span>한 끼 가격</span>
              <div>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={company.price}
                  onChange={(e) => updateCompany((c) => ({ ...c, price: Number(e.target.value) }))}
                />
                <b>원</b>
              </div>
            </label>
          </div>

          <div className="stats">
            <div><span>총 도시락</span><strong>{totalMeals}</strong><small>개</small></div>
            <div><span>총 결제금액</span><strong>{won(chargeableMeals * company.price)}</strong></div>
            <div><span>입금 완료</span><strong>{company.people.filter((p) => p.paid).length}</strong><small> / {company.people.length}명</small></div>
          </div>
        </div>

        <section className="card">
          <div className="section-head">
            <div><p className="eyebrow">ATTENDANCE</p><h2>날짜별 식사 체크</h2></div>
            <div className="date-adder">
              <label>
                <span>추가할 날짜</span>
                <input
                  type="date"
                  value={newLunchDate}
                  onChange={(event) => setNewLunchDate(event.target.value)}
                />
              </label>
              <button className="small-button dark" onClick={addLunchDay}>＋ 날짜 추가</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>날짜</th>{company.people.map((p) => <th key={p.id}>{p.name}</th>)}<th>수량</th><th>정산</th><th /></tr></thead>
              <tbody>{company.days.map((day) => (
                <tr key={day.id}>
                  <td>
                    <input
                      type="date"
                      value={day.date}
                      aria-label="식사 날짜"
                      onChange={(e) => updateCompany((c) => ({ ...c, days: c.days.map((d) => d.id === day.id ? { ...d, date: e.target.value } : d) }))}
                    />
                    <span>{prettyDate(day.date)}</span>
                  </td>
                  {company.people.map((person) => {
                    const checked = day.attendees.includes(person.id);
                    return <td key={person.id}><button
                      className={`check ${checked ? "on" : ""}`}
                      aria-pressed={checked}
                      aria-label={`${person.name} 식사 ${checked ? "취소" : "추가"}`}
                      onClick={() => updateCompany((c) => ({ ...c, days: c.days.map((d) => d.id !== day.id ? d : ({
                        ...d, attendees: checked ? d.attendees.filter((id) => id !== person.id) : [...d.attendees, person.id],
                      })) }))}
                    >{checked ? "✓" : ""}</button></td>;
                  })}
                  <td><b>{day.attendees.length}개</b></td>
                  <td>
                    <button
                      className={`sample-toggle ${day.complimentary ? "on" : ""}`}
                      aria-pressed={Boolean(day.complimentary)}
                      aria-label={`${prettyDate(day.date)} ${day.complimentary ? "유료로 변경" : "무료 샘플로 변경"}`}
                      onClick={() => updateCompany((c) => ({
                        ...c,
                        days: c.days.map((d) => d.id === day.id
                          ? { ...d, complimentary: !d.complimentary }
                          : d),
                      }))}
                    >
                      {day.complimentary ? "무료" : "유료"}
                    </button>
                  </td>
                  <td><button className="icon-button danger" aria-label="날짜 삭제" onClick={() => updateCompany((c) => ({ ...c, days: c.days.filter((d) => d.id !== day.id) }))}>×</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {!company.days.length && <div className="empty">날짜를 추가하고 식사한 사람을 체크해 주세요.</div>}
        </section>

        <section className="card">
          <div className="section-head">
            <div><p className="eyebrow">SETTLEMENT</p><h2>개인별 정산</h2></div>
            <button className="small-button" onClick={() => updateCompany((c) => ({
              ...c,
              people: [...c.people, { id: crypto.randomUUID(), name: `사람 ${c.people.length + 1}`, paid: false }],
            }))}>＋ 사람 추가</button>
          </div>
          <div className="people-grid">
            {company.people.map((person) => (
              <article key={person.id} className={person.paid ? "paid" : ""}>
                <div className="person-row">
                  <span className="avatar">{person.name.slice(0, 1)}</span>
                  <input value={person.name} aria-label="이름" onChange={(e) => updateCompany((c) => ({ ...c, people: c.people.map((p) => p.id === person.id ? { ...p, name: e.target.value } : p) }))} />
                  <button className="icon-button danger" aria-label="사람 삭제" onClick={() => updateCompany((c) => ({
                    ...c,
                    people: c.people.filter((p) => p.id !== person.id),
                    days: c.days.map((d) => ({ ...d, attendees: d.attendees.filter((id) => id !== person.id) })),
                  }))}>×</button>
                </div>
                <p>
                  {chargeableCounts[person.id]}회 × {won(company.price)}
                  {counts[person.id] > chargeableCounts[person.id]
                    ? ` · 무료 ${counts[person.id] - chargeableCounts[person.id]}회`
                    : ""}
                </p>
                <strong>{won(chargeableCounts[person.id] * company.price)}</strong>
                <button className="pay" onClick={() => updateCompany((c) => ({
                  ...c, people: c.people.map((p) => p.id === person.id ? { ...p, paid: !p.paid } : p),
                }))}>{person.paid ? "✓ 입금 완료" : "입금 대기"}</button>
              </article>
            ))}
          </div>
          {!company.people.length && <div className="empty">정산할 사람을 추가해 주세요.</div>}
        </section>
      </section>
    </main>
  );
}

