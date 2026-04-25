import React from "react";

const TH: React.CSSProperties = {
  background: "#f3e9d2", padding: "7px 10px",
  fontWeight: 700, fontSize: 11, color: "#5a4a30",
  border: "1px solid #d8c8a8", width: "28%",
  textAlign: "left",
};
const TD: React.CSSProperties = {
  padding: "7px 10px", border: "1px solid #d8c8a8",
  fontSize: "11.5px", color: "#2a2418",
};

type Props = { kind: "vacation" | "proposal" | "resignation" };

export function PdfBody({ kind }: Props) {
  if (kind === "vacation") {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <tbody>
          <tr>
            <th style={TH}>소속</th>
            <td style={TD}>외과 2병동</td>
            <th style={{ ...TH, width: "20%" }}>직책</th>
            <td style={TD}>간호사</td>
          </tr>
          <tr>
            <th style={TH}>성명</th>
            <td style={TD}>박지영</td>
            <th style={{ ...TH, width: "20%" }}>연락처</th>
            <td style={TD}>010-1234-5678</td>
          </tr>
          <tr>
            <th style={TH}>휴가종류</th>
            <td style={TD}>연차 (1일)</td>
            <th style={{ ...TH, width: "20%" }}>일수</th>
            <td style={TD}>1일</td>
          </tr>
          <tr>
            <th style={TH}>기간</th>
            <td style={{ ...TD }} colSpan={3}>2026년 4월 20일 ~ 2026년 4월 20일</td>
          </tr>
          <tr>
            <th style={TH}>사유</th>
            <td style={{ ...TD, height: 80, verticalAlign: "top" }} colSpan={3}>개인 사유</td>
          </tr>
        </tbody>
      </table>
    );
  }

  if (kind === "proposal") {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <tbody>
          <tr>
            <th style={TH}>제목</th>
            <td style={TD} colSpan={3}>3월 감염관리 소모품 구매 품의</td>
          </tr>
          <tr>
            <th style={TH}>품목</th>
            <td style={TD}>마스크 KF94 500매 외</td>
            <th style={{ ...TH, width: "20%" }}>수량</th>
            <td style={TD}>3종</td>
          </tr>
          <tr>
            <th style={TH}>금액</th>
            <td style={TD} colSpan={3}>450,000 원</td>
          </tr>
          <tr>
            <th style={TH}>사유</th>
            <td style={{ ...TD, height: 80, verticalAlign: "top" }} colSpan={3}>3월 소모품 소진으로 인한 긴급 구매</td>
          </tr>
        </tbody>
      </table>
    );
  }

  // resignation
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
      <tbody>
        {[
          ["소속", "외과 2병동"],
          ["성명", "박지영"],
          ["사직 희망일", "2026년 6월 30일"],
          ["사유", "개인 사정으로 인한 사직"],
        ].map(([label, value]) => (
          <tr key={label}>
            <th style={TH}>{label}</th>
            <td style={TD}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
