import React from 'react';
import { Line } from 'react-chartjs-2';

export default function MiniChart({data, label, compact=true}){
  const hasData = Array.isArray(data) && data.length>0;
  const chartData = { labels: hasData? data.map(d=>d.t): [''], datasets: [{ label, data: hasData? data.map(d=>d.c): [0], borderColor:'#8884d8', tension:0.2, pointRadius:0 }] };
  return (
    <div style={{minHeight: compact?80:140, background:'#fff', padding:8, borderRadius:6, display:'flex', flexDirection:'column'}}>
      {!hasData && (<div style={{flex:'1',display:'flex',alignItems:'center',justifyContent:'center',color:'#999'}}>데이터 없음</div>)}
      {hasData && (<Line data={chartData} options={{plugins:{legend:{display:false}}, elements:{line:{borderWidth:2}}, scales:{x:{display:false}, y:{display:false}}}} />)}
    </div>
  )
}
