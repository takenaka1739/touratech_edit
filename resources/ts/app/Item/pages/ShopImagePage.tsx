import { useState } from 'react';
//import Draggable from "react-draggable";
//import { Breadcrumbs } from '@/pages/';
//import AppLayout from '@/Layouts/AppLayout';
//import { usePage, router } from '@inertiajs/react';
//import ReactPlayer from 'react-player';

export const ShopImagePage = () => {

    const [text, setText] = useState("");
    //const [droppedItem, setDroppedItem] = useState(null);
//
    //const handleDragStart = (event) => {
    //    event.dataTransfer.setData("text", event.target.id);
    //};
//
    //const handleDrop = () => {
    //    //event.preventDefault();
    //    //const data = event.dataTransfer.getData("text");
    //    //setDroppedItem(data);
    //    setDroppedItem(null);
    //};
//
    //const handleDragOver = () => {
    //    //event.preventDefault();
    //};

  return (
    <div id="shop-image">
      <div id="button-area">
        <a id="back-button">← 受注管理システム</a>
        <a id="ref-button">他商品情報参照</a>
      </div>
      <div id="input-area">
        <div id="image-area">
          <img></img>
          <p></p>
          {/*<div id="item1" draggable onDragStart={() => handleDragStart}>
              ドラッグ可能な要素
          </div>
          <div onDragOver={() => handleDragOver} onDrop={() => handleDrop} style={{ height:"100px", border: "1px solid black", padding: "20px", marginTop: "20px" }}>
              ドロップエリア
          </div>
          {droppedItem && <p>ドロップされた要素: {droppedItem}</p>}*/}
        </div>
        <div id="item-info">
          <input id="item-name" value={text} onChange={(event) => setText(event.target.value)}/>
          <hr/>
          <div id="price-col">
            <label>￥</label>
            <input value={text} onChange={(event) => setText(event.target.value)}/>
            <label>（税込み）</label>
          </div>
          <label>ポイント：〇〇pt</label>
          <hr/>
          <label>この商品について</label>
          <input id="item-detail" value={text} onChange={(event) => setText(event.target.value)}/>
        </div>
        <div id="vari-info">
          <div>
            <div className="vari-name">
              <input value={text} onChange={(event) => setText(event.target.value)}/>
              <button>＋</button>
            </div>
            <div className="vari-kind-list">
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
            </div>
          </div>
          <div>
            <div className="vari-name">
              <input value={text} onChange={(event) => setText(event.target.value)}/>
              <button>＋</button>
            </div>
            <div className="vari-kind-list">
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
            </div>
          </div>
          <div>
            <div className="vari-name">
              <input value={text} onChange={(event) => setText(event.target.value)}/>
              <button>＋</button>
            </div>
            <div className="vari-kind-list">
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
            </div>
          </div>
          <div>
            <div className="vari-name">
              <input value={text} onChange={(event) => setText(event.target.value)}/>
              <button>＋</button>
            </div>
            <div className="vari-kind-list">
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
              <div className="vari-kind">
                <input value={text} onChange={(event) => setText(event.target.value)}/>
                <button>✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};