
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function App() {
  const [products, setProducts] = useState(() => {
    const stored = localStorage.getItem('importadorProducts');
    return stored ? JSON.parse(stored) : [];
  });

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [qty, setQty] = useState(1);
  const [details, setDetails] = useState('');
  const [image, setImage] = useState(null);
  const totalUSD = products.reduce((acc, p) => acc + (p.price * p.qty), 0);
  const totalKG = products.reduce((acc, p) => acc + (p.weight * p.qty), 0);


// ... todo igual hasta arriba
useEffect(() => {
  const compressImage = (imageDataUrl, callback) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 150;
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.6);
      callback(compressed);
    };
    img.src = imageDataUrl;
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          compressImage(event.target.result, setImage);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  window.addEventListener("paste", handlePaste);
  return () => window.removeEventListener("paste", handlePaste);
}, []);


  const addProduct = () => {
    if (!name || !price || !weight || !qty) return;
    const parsedPrice = parseFloat(price);
    const parsedWeight = parseFloat(weight);
    const parsedQty = parseInt(qty);

    const totalUsd = parsedPrice * parsedQty;
    const totalKg = parsedWeight * parsedQty;

    const newProduct = {
      name,
      price: parsedPrice,
      weight: parsedWeight,
      qty: parsedQty,
      totalUsd,
      totalKg,
      details,
      image,
    };

    setProducts([...products, newProduct]);
    setName(''); setPrice(''); setWeight(''); setQty(1); setDetails(''); setImage(null);
  };

  const updateQty = (index, value) => {
    const updated = [...products];
    updated[index].qty = parseInt(value);
    updated[index].totalUsd = updated[index].price * updated[index].qty;
    updated[index].totalKg = updated[index].weight * updated[index].qty;
    setProducts(updated);
  };
  const updateWeight = (index, value) => {
  const updated = [...products];
  updated[index].weight = parseFloat(value);
  updated[index].totalKg = updated[index].weight * updated[index].qty;
  setProducts(updated);
};


  const handlePasteImageOnRow = (e, index) => {
  const items = e.clipboardData?.items;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      e.preventDefault();
      const blob = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        const compressImage = (imageDataUrl, callback) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX_WIDTH = 150;
            const scale = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL("image/jpeg", 0.6);
            callback(compressed);
          };
          img.src = event.target.result;
        };
        compressImage(reader.result, (compressed) => {
          const updated = [...products];
          updated[index].image = compressed;
          setProducts(updated);
        });
      };
      reader.readAsDataURL(blob);
    }
  }
};


  const deleteProduct = (index) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  const saveToLocal = () => {
    localStorage.setItem('importadorProducts', JSON.stringify(products));
    alert("Guardado en localStorage ✅");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("PEDIDO AL CHINO", 14, 15);

    const rows = products.map(p => [
      p.name,
      p.qty,
      `$${p.price}`,
      `$${(p.price * p.qty).toFixed(2)}`,
      p.details || '-'
    ]);

    const total = products.reduce((acc, p) => acc + (p.price * p.qty), 0);

    autoTable(doc, {
      head: [["Nombre", "Qty", "FOB USD", "Total USD", "Details"]],
      body: rows,
      startY: 25,
      styles: { fontSize: 10 }
    });

    doc.text(`TOTAL ORDEN: $${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save("pedido_chino.pdf");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center">Pedido al Chino</h1>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold text-lg mb-2">Agregar producto</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Nombre" className="border p-2 rounded" value={name} onChange={e => setName(e.target.value)} />
          <input type="number" placeholder="FOB USD" className="border p-2 rounded" value={price} onChange={e => setPrice(e.target.value)} />
          <input type="number" placeholder="Peso unitario (kg)" className="border p-2 rounded" value={weight} onChange={e => setWeight(e.target.value)} />
          <input type="number" placeholder="Cantidad" className="border p-2 rounded" value={qty} onChange={e => setQty(e.target.value)} />
          <input type="text" placeholder="Details (opcional)" className="border p-2 rounded" value={details} onChange={e => setDetails(e.target.value)} />
        </div>
        <div className="border p-4 rounded text-center text-gray-500">
          <p className="text-sm mb-2">Pegá una imagen o subila</p>
          <input
            type="file"
            accept="image/*"
            className="mb-2"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const compressImage = (imageDataUrl, callback) => {
                  const img = new Image();
                  img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 150;
                    const scale = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const compressed = canvas.toDataURL("image/jpeg", 0.6);
                    callback(compressed);
                  };
                  img.src = imageDataUrl;
                };
                compressImage(event.target.result, setImage);
              };
              reader.readAsDataURL(file);
            }}
          />
          {image && <img src={image} alt="Preview" className="mx-auto h-24" />}
        </div>

        <button onClick={addProduct} className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">+ Agregar</button>
      </div>
      <div className="flex justify-center gap-8 text-lg font-semibold bg-white p-4 rounded shadow">
  <div>💰 Total FOB USD: ${totalUSD.toFixed(2)}</div>
  <div>⚖️ Total KG: {totalKG.toFixed(2)} kg</div>
</div>


      <div className="flex gap-4 justify-center">
        <button onClick={saveToLocal} className="bg-black text-white px-4 py-2 rounded">💾 Guardar productos</button>
        <button onClick={exportPDF} className="bg-green-600 text-white px-4 py-2 rounded">Exportar PDF</button>
      </div>

      <div>
        <table className="w-full text-sm mt-6 border bg-white shadow rounded overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              {["Nombre", "Imagen", "FOB", "Qty", "Total USD", "Total KG", "Details", "Eliminar"].map(h => (
                <th key={h} className="p-2 border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((prod, i) => {
              const totalUsd = prod.totalUsd !== undefined ? prod.totalUsd : (prod.price * prod.qty);
              const totalKg = prod.totalKg !== undefined ? prod.totalKg : (prod.weight * prod.qty);
              return (
                <tr key={i}>
                  <td className="border p-2">{prod.name}</td>
                  <td className="border p-2" onPaste={(e) => handlePasteImageOnRow(e, i)}>

  {prod.image ? (
    <div className="flex flex-col items-center">
      <img src={prod.image} className="h-16 mb-1" />
      <button
        className="text-xs text-red-500 hover:underline"
        onClick={() => {
          const updated = [...products];
          updated[i].image = null;
          setProducts(updated);
        }}
      >
        Eliminar
      </button>
    </div>
  ) : (
    <span className="text-gray-400 text-xs">Sin imagen</span>
  )}
</td>

                  <td className="border p-2">${prod.price}</td>
                  <td className="border p-2"><input type="number" value={prod.qty} onChange={e => updateQty(i, e.target.value)} className="w-16 border p-1" /></td>
                  <td className="border p-2">${totalUsd.toFixed(2)}</td>
                  <td className="border p-2">
  <input
    type="number"
    value={prod.weight}
    onChange={(e) => updateWeight(i, e.target.value)}
    className="w-16 border p-1"
  />
</td>

                  <td className="border p-2">{prod.details || '-'}</td>
                  <td className="border p-2"><button className="text-red-500" onClick={() => deleteProduct(i)}>X</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
