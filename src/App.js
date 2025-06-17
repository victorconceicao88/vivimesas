import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth, database } from './firebase';
import { ref, onValue, set, update, remove, push, get } from 'firebase/database';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { menu } from './MenuData';
import { FaPrint, FaHistory, FaSignOutAlt, FaBox, FaUtensils, FaSearch, FaPlus, FaMinus, FaTimes, FaCheck, FaChevronLeft, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import { GiMeal, GiSteak, GiHamburger, GiCakeSlice, GiChickenOven, GiSodaCan, GiWaterBottle, GiFruitBowl } from 'react-icons/gi';
import { MdTableRestaurant, MdLocalBar, MdOutlineRiceBowl, MdOutlineIcecream, MdFastfood, MdOutlineDinnerDining } from 'react-icons/md';
import { IoIosArrowForward, IoIosArrowBack } from 'react-icons/io';
import { BsThreeDotsVertical, BsPrinter, BsClockHistory } from 'react-icons/bs';
import { RiRestaurantLine, RiDrinksLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

const PRINTER_CONFIG = {
  serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
  characteristicUUID: '00002af1-0000-1000-8000-00805f9b34fb',
  deviceName: 'BlueTooth Printer',
  maxRetries: 3,
  chunkSize: 20,
  delayBetweenChunks: 50
};

const initialTables = () => {
  const tables = [];
  
  // Mesas internas (1-16)
  for (let i = 1; i <= 18; i++) {
    tables.push({
      id: i.toString(),
      type: 'interna',
      status: 'available',
      currentOrder: null,
      ordersHistory: {}
    });
  }
  
  // Mesas externas (17-36)
  for (let i = 19; i <= 36; i++) {
    tables.push({
      id: i.toString(),
      type: 'externa',
      status: 'available',
      currentOrder: null,
      ordersHistory: {}
    });
  }
  
  return tables;
};

const getCategoryIcon = (category) => {
  switch (category) {
    case 'churrasco':
      return <GiSteak className="text-amber-600" />;
    case 'hamburgueres':
      return <GiHamburger className="text-red-500" />;
    case 'combos':
      return <MdFastfood className="text-green-600" />;
    case 'porcoes':
      return <MdOutlineRiceBowl className="text-yellow-600" />;
    case 'bebidas':
      return <RiDrinksLine className="text-blue-500" />;
    case 'sobremesas':
      return <MdOutlineIcecream className="text-pink-500" />;
    case 'pratosSemana':
      return <MdOutlineDinnerDining className="text-purple-500" />;
    default:
      return <RiRestaurantLine className="text-gray-500" />;
  }
};

const AdminPanel = () => {
  // Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  
  // Estado do sistema
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Impressora
  const [printerConnected, setPrinterConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printerDeviceRef = useRef(null);
  const printerCharacteristicRef = useRef(null);
  const [printedItems, setPrintedItems] = useState({});
  
  // Modais
  const [showTableDetailsModal, setShowTableDetailsModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCloseOrderModal, setShowCloseOrderModal] = useState(false);
  
  // Itens do menu
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState('churrasco');
  
  // Histórico
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyDateRange, setHistoryDateRange] = useState({
    start: new Date(new Date().setHours(0, 0, 0, 0)),
    end: new Date(new Date().setHours(23, 59, 59, 999))
  });
  
  // Fechamento de pedido
  const [isClosingOrder, setIsClosingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  // Refs
  const menuCategoriesRef = useRef(null);
  const menuItemsRef = useRef(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customizingItem, setCustomizingItem] = useState(false);

  // Efeito para verificar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        handleReconnectPrinter();
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Efeito para carregar mesas
  useEffect(() => {
    if (!isAuthenticated) return;

    setTables(initialTables());
    
    const tablesRef = ref(database, 'tables');
    const unsubscribe = onValue(tablesRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      const tablesData = initialTables().map(table => {
        const tableData = data[table.id] || {};
        let currentOrder = null;
        
        if (tableData.currentOrder) {
          const orders = Object.entries(tableData.currentOrder);
          if (orders.length > 0) {
            currentOrder = {
              id: orders[0][0],
              ...orders[0][1],
              items: orders[0][1].items?.map(item => ({
                ...item,
                notes: item.notes || ''
              })) || []
            };
          }
        }

        return { 
          ...table,
          currentOrder,
          ordersHistory: tableData.ordersHistory || {},
          status: tableData.status || 'available'
        };
      });

      setTables(tablesData);
      setLastUpdate(new Date());
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Efeito para carregar pedido selecionado
  useEffect(() => {
    if (!isAuthenticated || !selectedTable) {
      setSelectedOrder(null);
      return;
    }

    const orderRef = ref(database, `tables/${selectedTable}/currentOrder`);

    const unsubscribe = onValue(orderRef, (snapshot) => {
      const orderData = snapshot.val();
      
      if (orderData) {
        const orders = Object.entries(orderData);
        if (orders.length > 0) {
          const [orderId, order] = orders[0];
          const loadedOrder = { 
            id: orderId, 
            ...order,
            items: order.items?.map(item => ({
              ...item,
              notes: item.notes || ''
            })) || []
          };
          
          const newPrintedItems = {...printedItems};
          let hasPrintedItems = false;
          
          loadedOrder.items?.forEach(item => {
            const itemKey = `${selectedTable}-${item.id}-${item.addedAt || ''}`;
            if (item.printed && !printedItems[itemKey]) {
              newPrintedItems[itemKey] = true;
              hasPrintedItems = true;
            }
          });
          
          if (hasPrintedItems) {
            setPrintedItems(newPrintedItems);
          }
          
          setSelectedOrder(loadedOrder);
        } else {
          setSelectedOrder(null);
        }
      } else {
        setSelectedOrder(null);
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, selectedTable, printedItems]);

  // Funções de persistência da impressora
  const savePrinterState = useCallback((device) => {
    try {
      const printerState = {
        deviceId: device.id,
        deviceName: device.name,
        connected: device.gatt.connected,
        lastConnected: Date.now()
      };
      localStorage.setItem('bluetoothPrinter', JSON.stringify(printerState));
    } catch (err) {
      console.error('Erro ao salvar estado da impressora:', err);
    }
  }, []);

  const clearPrinterState = useCallback(() => {
    localStorage.removeItem('bluetoothPrinter');
    setPrinterConnected(false);
  }, []);

  const handleDisconnection = useCallback(() => {
    console.log('Impressora desconectada');
    clearPrinterState();
    printerDeviceRef.current = null;
    printerCharacteristicRef.current = null;
  }, [clearPrinterState]);

  // Função para reconectar impressora
  const handleReconnectPrinter = useCallback(async () => {
    try {
      const savedPrinter = localStorage.getItem('bluetoothPrinter');
      if (!savedPrinter) return false;

      const printerState = JSON.parse(savedPrinter);
      if (!printerState.deviceId || !printerState.connected) return false;

      const isRecentConnection = Date.now() - printerState.lastConnected < 5 * 60 * 1000;
      if (!isRecentConnection) {
        clearPrinterState();
        return false;
      }

      console.log('Tentando reconectar à impressora...');

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: printerState.deviceName }],
        optionalServices: [PRINTER_CONFIG.serviceUUID]
      });

      if (!device) {
        clearPrinterState();
        return false;
      }

      device.addEventListener('gattserverdisconnected', handleDisconnection);

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(PRINTER_CONFIG.serviceUUID);
      const characteristic = await service.getCharacteristic(PRINTER_CONFIG.characteristicUUID);

      printerDeviceRef.current = device;
      printerCharacteristicRef.current = characteristic;
      setPrinterConnected(true);
      savePrinterState(device);

      console.log('Reconectado com sucesso à impressora');
      return true;
    } catch (err) {
      console.error('Erro na reconexão Bluetooth:', err);
      clearPrinterState();
      return false;
    }
  }, [handleDisconnection, savePrinterState, clearPrinterState]);

  // Função para conectar à impressora
  const connectToPrinter = useCallback(async () => {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth não suportado neste navegador');
      }
  
      setLoading(true);
      setError(null);
  
      if (printerDeviceRef.current?.gatt?.connected) {
        return true;
      }
  
      console.log('Procurando dispositivo Bluetooth...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: PRINTER_CONFIG.deviceName }],
        optionalServices: [PRINTER_CONFIG.serviceUUID]
      });
  
      if (!device) {
        throw new Error('Nenhum dispositivo selecionado');
      }
  
      device.addEventListener('gattserverdisconnected', handleDisconnection);
  
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(PRINTER_CONFIG.serviceUUID);
      const characteristic = await service.getCharacteristic(PRINTER_CONFIG.characteristicUUID);
  
      printerDeviceRef.current = device;
      printerCharacteristicRef.current = characteristic;
      setPrinterConnected(true);
      savePrinterState(device);
  
      console.log('Conectado com sucesso à impressora');
      return true;
    } catch (err) {
      console.error('Erro na conexão Bluetooth:', err);
      setError(`Falha na conexão: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleDisconnection, savePrinterState]);

  // Função para enviar dados para impressora
  const sendToPrinter = useCallback(async (data, printerType) => {
    let retryCount = 0;
    
    while (retryCount < PRINTER_CONFIG.maxRetries) {
      try {
        if (!printerDeviceRef.current?.gatt?.connected) {
          console.log(`Tentativa ${retryCount + 1}: Reconectando...`);
          const connected = await connectToPrinter();
          if (!connected) throw new Error('Falha ao reconectar');
        }
  
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        let offset = 0;
        
        console.log(`Enviando ${encodedData.length} bytes para ${printerType}...`);
        
        while (offset < encodedData.length) {
          const chunk = encodedData.slice(offset, offset + PRINTER_CONFIG.chunkSize);
          await printerCharacteristicRef.current.writeValueWithoutResponse(chunk);
          offset += PRINTER_CONFIG.chunkSize;
          
          await new Promise(resolve => 
            setTimeout(resolve, PRINTER_CONFIG.delayBetweenChunks)
          );
        }
        
        console.log('Dados enviados com sucesso');
        return true;
        
      } catch (err) {
        retryCount++;
        console.error(`Tentativa ${retryCount} falhou:`, err);
        
        if (retryCount >= PRINTER_CONFIG.maxRetries) {
          console.error('Número máximo de tentativas atingido');
          setError(`Falha na impressão: ${err.message}`);
          return false;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, 1000 * retryCount)
        );
      }
    }
  }, [connectToPrinter]);

  // Função para formatar recibo
  const formatReceipt = useCallback((order, items) => {
    // Categorias da cozinha (sem acentos)
    const kitchenCategories = ['churrasco', 'hamburgueres', 'combos', 'porcoes', 'sobremesas', 'pratosSemana'];
    
    // Separar itens
    const kitchenItems = items.filter(item => kitchenCategories.includes(item.category));
    const barItems = items.filter(item => !kitchenCategories.includes(item.category));

    // Formatação
    let receipt = '\n\n'; // Espaço inicial para alinhamento
    
    // Função para texto GIGANTE (centralizado e em bloco)
    const giantText = (text) => {
      const border = '********************************\n';
      const centered = text.toUpperCase().padStart(15 + text.length/2).padEnd(30) + '\n';
      return border + centered + border;
    };

    // Função para texto GRANDE
    const bigText = (text) => text.toUpperCase().padEnd(35, ' ') + '\n';

    // Função para observação em negrito
    const boldNote = (text) => `**OBS: ${text.toUpperCase()}**\n`;

    // Cabeçalho
    receipt += giantText('cozinha da vivi');
    receipt += bigText(`mesa: ${selectedTable}`);
    receipt += bigText(`pedido: ${order.id.slice(0, 8)}`);
    receipt += '--------------------------------\n\n';

    // Seção COZINHA
    if (kitchenItems.length > 0) {
      receipt += giantText('cozinha');
      
      kitchenItems.forEach(item => {
        receipt += bigText(`${item.quantity}x ${item.nome}`);
        receipt += bigText(`valor: ${(item.price * item.quantity).toFixed(2)}`);
        
        // Opções (se existirem)
        if (item.options) {
          Object.values(item.options).flat().forEach(opt => {
            if (opt) receipt += bigText(`> ${opt}`);
          });
        }
        
        // Observações em negrito
        if (item.notes) receipt += boldNote(item.notes);
        
        receipt += '--------------------------------\n';
      });
    }
    
    // Seção BAR
    if (barItems.length > 0) {
      receipt += giantText('bar');
      
      barItems.forEach(item => {
        receipt += bigText(`${item.quantity}x ${item.nome}`);
        receipt += bigText(`valor: ${(item.price * item.quantity).toFixed(2)}`);
        
        // Opções (se existirem)
        if (item.options) {
          Object.values(item.options).flat().forEach(opt => {
            if (opt) receipt += bigText(`> ${opt}`);
          });
        }
        
        // Observações em negrito
        if (item.notes) receipt += boldNote(item.notes);
        
        receipt += '--------------------------------\n';
      });
    }

    // Rodapé
    receipt += '\n' + giantText('obrigado');
    
    return receipt;
  }, [selectedTable]);

  // Função para marcar itens como impressos
  const markItemsAsPrinted = useCallback(async (tableId, orderId, items) => {
    try {
      const orderRef = ref(database, `tables/${tableId}/currentOrder/${orderId}`);
      
      const newPrintedItems = {...printedItems};
      items.forEach(item => {
        newPrintedItems[`${tableId}-${item.id}-${item.addedAt}`] = true;
      });
      setPrintedItems(newPrintedItems);
  
      const currentOrderSnapshot = await get(orderRef);
      const currentOrder = currentOrderSnapshot.val();
      
      const updatedItems = currentOrder.items.map(orderItem => {
        const wasPrinted = items.some(
          printedItem => printedItem.id === orderItem.id && printedItem.addedAt === orderItem.addedAt
        );
        return wasPrinted ? { ...orderItem, printed: true } : orderItem;
      });
  
      await update(orderRef, {
        items: updatedItems,
        updatedAt: Date.now()
      });
  
    } catch (err) {
      console.error("Erro ao marcar itens como impressos:", err);
      throw err;
    }
  }, [printedItems]);

  // Função para imprimir pedido
  const printOrder = useCallback(async () => {
    if (!selectedTable || !selectedOrder?.id || !selectedOrder.items?.length) {
      setError('Nenhum pedido válido para imprimir');
      return;
    }
  
    try {
      setIsPrinting(true);
      setError(null);
      
      const itemsToPrint = selectedOrder.items.filter(item => {
        const itemKey = `${selectedTable}-${item.id}-${item.addedAt || ''}`;
        return !printedItems[itemKey] && !item.printed;
      });
  
      if (itemsToPrint.length === 0) {
        setError('Nenhum novo item para imprimir');
        return;
      }
      
      // Separar itens por categoria (cozinha/bar)
      const kitchenItems = itemsToPrint.filter(item => 
        item.category !== 'bebidas'
      );
      
      const barItems = itemsToPrint.filter(item => 
        item.category === 'bebidas'
      );
      
      // Enviar para as impressoras correspondentes
      if (kitchenItems.length > 0) {
        const kitchenReceipt = formatReceipt(selectedOrder, kitchenItems, 'cozinha');
        await sendToPrinter(kitchenReceipt, 'cozinha');
      }
      
      if (barItems.length > 0) {
        const barReceipt = formatReceipt(selectedOrder, barItems, 'bar');
        await sendToPrinter(barReceipt, 'bar');
      }
      
      // Marcar itens como impressos
      await markItemsAsPrinted(selectedTable, selectedOrder.id, itemsToPrint);
      
      setSelectedOrder(prev => ({
        ...prev,
        items: prev.items.map(item => {
          const wasPrinted = itemsToPrint.some(
            printedItem => printedItem.id === item.id && printedItem.addedAt === item.addedAt
          );
          return wasPrinted ? { ...item, printed: true } : item;
        })
      }));
    } catch (err) {
      console.error('Erro ao imprimir:', err);
      setError(`Falha na impressão: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  }, [selectedTable, selectedOrder, printedItems, formatReceipt, sendToPrinter, markItemsAsPrinted]);

  // Função para criar novo pedido
  const createNewOrder = useCallback(async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      const orderRef = ref(database, `tables/${selectedTable}/currentOrder`);
      const newOrderRef = push(orderRef);
      
      const newOrder = {
        id: newOrderRef.key,
        items: [],
        status: 'open',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tableId: selectedTable
      };

      await set(newOrderRef, newOrder);
      setSelectedOrder(newOrder);
      
      // Atualizar status da mesa
      const tableRef = ref(database, `tables/${selectedTable}`);
      await update(tableRef, {
        status: 'occupied'
      });
    } catch (err) {
      setError('Erro ao criar novo pedido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTable]);

  // Função para adicionar item ao pedido
  const addItemToOrder = useCallback(async () => {
    if (!selectedTable || !selectedMenuItem) return;

    setLoading(true);
    try {
      let orderRef;
      let orderData;
      
      // Calcular preço base + adicionais
      let finalPrice = selectedMenuItem.preco;
      
      // Processar opções selecionadas e calcular adicionais
      const processedOptions = {};
      if (selectedMenuItem.opcoes) {
        Object.entries(selectedMenuItem.opcoes).forEach(([optionKey, optionConfig]) => {
          if (selectedOptions[optionKey]) {
            processedOptions[optionKey] = selectedOptions[optionKey];
            
            // Verificar se há adicionais nas opções selecionadas
            if (Array.isArray(selectedOptions[optionKey])) {
              // Opção do tipo checkbox (múltiplas seleções)
              selectedOptions[optionKey].forEach(val => {
                const optionItem = optionConfig.itens.find(i => i.valor === val);
                if (optionItem && optionItem.preco) {
                  finalPrice += optionItem.preco;
                }
              });
            } else {
              // Opção do tipo radio (única seleção)
              const optionItem = optionConfig.itens.find(i => i.valor === selectedOptions[optionKey]);
              if (optionItem && optionItem.preco) {
                finalPrice += optionItem.preco;
              }
            }
          }
        });
      }

      if (selectedOrder?.id) {
        orderRef = ref(database, `tables/${selectedTable}/currentOrder/${selectedOrder.id}`);
        const currentItems = selectedOrder.items || [];
        
        orderData = {
          items: [...currentItems, {
            ...selectedMenuItem,
            quantity: newItemQuantity,
            addedAt: Date.now(),
            printed: false,
            notes: itemNotes[selectedMenuItem.id] || '',
            category: activeMenuTab,
            options: processedOptions,
            price: finalPrice // Usar o preço calculado com adicionais
          }],
          updatedAt: Date.now()
        };
      } else {
        orderRef = ref(database, `tables/${selectedTable}/currentOrder`);
        orderData = {
          items: [{
            ...selectedMenuItem,
            quantity: newItemQuantity,
            addedAt: Date.now(),
            printed: false,
            notes: itemNotes[selectedMenuItem.id] || '',
            category: activeMenuTab,
            options: processedOptions,
            price: finalPrice // Usar o preço calculado com adicionais
          }],
          status: 'open',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tableId: selectedTable
        };
      }

      if (selectedOrder?.id) {
        await update(orderRef, orderData);
      } else {
        const newOrderRef = await push(orderRef, orderData);
        setSelectedOrder({ id: newOrderRef.key, ...orderData });
        
        // Atualizar status da mesa
        const tableRef = ref(database, `tables/${selectedTable}`);
        await update(tableRef, {
          status: 'occupied'
        });
      }

      // Resetar estado
      setSelectedMenuItem(null);
      setNewItemQuantity(1);
      setSelectedOptions({});
      setItemNotes(prev => ({
        ...prev,
        [selectedMenuItem.id]: ''
      }));
      setCustomizingItem(false);
      
      setShowAddItemModal(false);
      setShowTableDetailsModal(true);
      
    } catch (err) {
      setError('Erro ao adicionar item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, selectedMenuItem, selectedOrder, newItemQuantity, itemNotes, activeMenuTab, selectedOptions]);

  // Função para lidar com a seleção de opções
  const handleOptionChange = (optionKey, optionValue, isCheckbox = false) => {
    if (isCheckbox) {
      setSelectedOptions(prev => {
        const currentValues = prev[optionKey] || [];
        if (currentValues.includes(optionValue)) {
          return {
            ...prev,
            [optionKey]: currentValues.filter(v => v !== optionValue)
          };
        } else {
          return {
            ...prev,
            [optionKey]: [...currentValues, optionValue]
          };
        }
      });
    } else {
      setSelectedOptions(prev => ({
        ...prev,
        [optionKey]: optionValue
      }));
    }
  };

  // Função para remover item do pedido
  const removeItemFromOrder = useCallback(async (itemId) => {
    if (!selectedTable || !selectedOrder?.items) return;
    
    setLoading(true);
    try {
      const orderRef = ref(database, `tables/${selectedTable}/currentOrder/${selectedOrder.id}`);
      const updatedItems = selectedOrder.items.filter(item => item.id !== itemId);
      
      await update(orderRef, {
        items: updatedItems,
        updatedAt: Date.now()
      });

      // Se não houver mais itens, fechar pedido
      if (updatedItems.length === 0) {
        await closeOrder();
      }
    } catch (err) {
      setError(`Falha ao remover item: ${err.message}`);
      console.error("Erro detalhado:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, selectedOrder]);

  // Função para atualizar quantidade do item
  const updateItemQuantity = useCallback(async (itemId, newQuantity) => {
    if (!selectedTable || !selectedOrder?.items || newQuantity < 1) return;
    
    setLoading(true);
    try {
      const orderRef = ref(database, `tables/${selectedTable}/currentOrder/${selectedOrder.id}`);
      const updatedItems = selectedOrder.items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      await update(orderRef, {
        items: updatedItems,
        updatedAt: Date.now()
      });
    } catch (err) {
      setError(`Falha ao atualizar quantidade: ${err.message}`);
      console.error("Erro detalhado:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, selectedOrder]);

  // Função para fechar pedido
const closeOrder = useCallback(async () => {
  if (!selectedTable || !selectedOrder?.id || !selectedOrder.items?.length) {
    setError('Não é possível fechar um pedido sem itens');
    return;
  }

  setIsClosingOrder(true);
  try {
    const table = tables.find(t => t.id === selectedTable);
    const total = selectedOrder.items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 1;
      return sum + (itemPrice * itemQuantity);
    }, 0);

    const orderToClose = {
      ...selectedOrder,
      total: total,
      closedAt: Date.now(),
      closedBy: auth.currentUser?.email || 'admin',
      status: 'closed',
      paymentMethod: paymentMethod // Adiciona o método de pagamento ao fechar
    };

    // Adicionar ao histórico
    const historyRef = ref(database, `tables/${selectedTable}/ordersHistory`);
    const newHistoryRef = push(historyRef);
    await set(newHistoryRef, orderToClose);

    // Remover pedido atual
    const orderRef = ref(database, `tables/${selectedTable}/currentOrder/${selectedOrder.id}`);
    await remove(orderRef);
    
    // Atualizar status da mesa
    const tableRef = ref(database, `tables/${selectedTable}`);
    await update(tableRef, {
      status: 'available'
    });
    
    // Atualizar estado local
    setTables(prevTables => prevTables.map(table => {
      if (table.id === selectedTable) {
        return {
          ...table,
          currentOrder: null,
          status: 'available'
        };
      }
      return table;
    }));
    
    // Resetar estados
    setSelectedOrder(null);
    setPaymentMethod('dinheiro'); // Resetar para o valor padrão
    setShowTableDetailsModal(false);
    setShowCloseOrderModal(false);
    
  } catch (error) {
    console.error("Erro ao fechar comanda:", error);
    setError(error.message || 'Erro ao fechar comanda');
  } finally {
    setIsClosingOrder(false);
  }
}, [selectedTable, selectedOrder, tables, paymentMethod]);

  // Função para carregar histórico de pedidos
  const loadOrderHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const historyRef = ref(database, 'tables');
      const snapshot = await get(historyRef);
      const data = snapshot.val() || {};
      
      let allOrders = [];
      
      Object.entries(data).forEach(([tableId, tableData]) => {
        if (tableData.ordersHistory) {
          Object.entries(tableData.ordersHistory).forEach(([orderId, order]) => {
            if (order.status === 'closed') {
              allOrders.push({
                ...order,
                id: orderId,
                tableId: tableId,
                closedAt: order.closedAt || Date.now()
              });
            }
          });
        }
      });
      
      // Ordenar por data de fechamento (mais recente primeiro)
      allOrders.sort((a, b) => b.closedAt - a.closedAt);
      
      setOrderHistory(allOrders);
      setShowHistoryModal(true);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      setError('Erro ao carregar histórico de pedidos');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Função para filtrar histórico
  const filteredHistory = useCallback(() => {
    let filtered = orderHistory;

    // Filtro por termo de busca
    if (historySearchTerm) {
      const term = historySearchTerm.trim().toLowerCase();
      filtered = filtered.filter(order => 
        order.tableId.toLowerCase().includes(term) ||
        order.items?.some(item => 
          item.nome.toLowerCase().includes(term)
      ));
    }

    // Filtro por data
    filtered = filtered.filter(order => {
      const orderDate = new Date(order.closedAt);
      return (
        orderDate >= historyDateRange.start &&
        orderDate <= historyDateRange.end
      );
    });

    return filtered;
  }, [orderHistory, historySearchTerm, historyDateRange]);

  // Função para calcular total do pedido
  const calculateOrderTotal = useCallback((order) => {
    if (!order?.items) return 0;
    return order.items.reduce((sum, item) => {
      const itemPrice = parseFloat(item.price) || 0;
      const itemQuantity = parseInt(item.quantity) || 1;
      return sum + (itemPrice * itemQuantity);
    }, 0);
  }, []);

  // Função para selecionar mesa
  const handleTableSelect = useCallback((tableNumber) => {
    setSelectedTable(tableNumber.toString());
    setShowTableDetailsModal(true);
  }, []);

  // Função para verificar itens não impressos
  const hasUnprintedItems = useCallback((order) => {
    if (!order?.items) return false;
    return order.items.some(item => {
      const itemKey = `${selectedTable}-${item.id}-${item.addedAt || ''}`;
      return !printedItems[itemKey] && !item.printed;
    });
  }, [selectedTable, printedItems]);

  // Função para filtrar mesas
  const filteredTables = useCallback(() => {
    switch (activeTab) {
      case 'active':
        return tables.filter(t => t.currentOrder);
      case 'internas':
        return tables.filter(t => t.type === 'interna');
      case 'externas':
        return tables.filter(t => t.type === 'externa');
      default:
        return tables;
    }
  }, [activeTab, tables]);

  // Paginação de mesas
  const tablesPerPage = 12;
  const paginatedTables = useCallback(() => {
    const start = currentPage * tablesPerPage;
    return filteredTables().slice(start, start + tablesPerPage);
  }, [currentPage, filteredTables]);

  const totalPages = Math.ceil(filteredTables().length / tablesPerPage);

  // Função para obter cor do badge da mesa
  const getTableBadgeColor = useCallback((table) => {
    if (table.currentOrder) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-green-100 text-green-800';
  }, []);

  // Função para obter ícone da mesa
  const getTableIcon = useCallback((table) => {
    if (table.type === 'interna') return <MdTableRestaurant className="text-blue-500" />;
    return <MdTableRestaurant className="text-green-500" />;
  }, []);

  // Função para login
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    setAuthError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError('Credenciais inválidas. Por favor, tente novamente.');
      console.error('Login error:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [email, password]);

  // Renderização do login
  const renderLogin = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Cozinha da Vivi</h1>
          <p className="text-gray-600">Painel Administrativo - Controle de Mesas</p>
        </div>
        
        {authError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          >
            {authError}
          </motion.div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Usuário</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="admin@example.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoadingAuth}
            className="w-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isLoadingAuth ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Carregando...
              </>
            ) : (
              'Entrar'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );

  // Renderização do cabeçalho
  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <motion.div 
              whileHover={{ rotate: 10 }}
              className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-md"
            >
              <MdTableRestaurant className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Cozinha da Vivi</h1>
              <p className="text-xs text-gray-500">Controle de Mesas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-gray-500">
              Atualizado: {lastUpdate.toLocaleTimeString()}
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectToPrinter}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium ${
                  printerConnected 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-50'
                } transition-colors`}
              >
                <div className={`w-2 h-2 rounded-full ${printerConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {printerConnected ? 'Impressora Conectada' : 'Conectar Impressora'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadOrderHistory}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-50 transition-colors"
              >
                <FaHistory className="h-4 w-4" />
                Histórico
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => signOut(auth)}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaSignOutAlt className="h-4 w-4" />
                Sair
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Renderização das abas de mesas
  const renderTableTabs = () => (
    <div className="bg-white border-r border-gray-200 md:h-[calc(100vh-4rem)] md:sticky md:top-16 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Mesas</h2>
            <p className="text-sm text-gray-500">Total: {tables.length} mesas</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
              {tables.filter(t => t.currentOrder).length} ocupadas
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
          {['all', 'active', 'internas', 'externas'].map((tab) => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveTab(tab); setCurrentPage(0); }}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                activeTab === tab 
                  ? tab === 'all' ? 'bg-blue-100 text-blue-800 font-medium' :
                    tab === 'active' ? 'bg-green-100 text-green-800 font-medium' :
                    tab === 'internas' ? 'bg-blue-100 text-blue-800 font-medium' :
                    'bg-green-100 text-green-800 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? 'Todas' :
               tab === 'active' ? 'Ocupadas' :
               tab === 'internas' ? 'Internas' : 'Externas'}
            </motion.button>
          ))}
        </div>
      </div>
      
      <div className="p-3">
        {paginatedTables().length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {paginatedTables().map((table) => {
                const hasOrder = table.currentOrder;
                const orderTotal = hasOrder ? calculateOrderTotal(table.currentOrder) : 0;
                const badgeColor = getTableBadgeColor(table);
                const tableIcon = getTableIcon(table);
                
                return (
                  <motion.button
                    key={table.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTableSelect(table.id)}
                    className={`relative p-3 rounded-xl transition-all duration-200 ${
                      selectedTable === table.id 
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-inner' 
                        : 'bg-white border border-gray-200 hover:border-blue-100 hover:shadow-sm'
                    } flex flex-col items-center justify-center h-full min-h-[100px]`}
                  >
                    <div className={`absolute top-1 right-1 ${badgeColor} text-xs px-2 py-0.5 rounded-full flex items-center`}>
                      {hasOrder ? 'Ocupada' : 'Disponível'}
                    </div>
                    
                    <div className="text-2xl mb-1">
                      {tableIcon}
                    </div>
                    
                    <span className="font-bold text-gray-800 text-lg mb-1">
                      Mesa {table.id}
                    </span>
                    
                    {hasOrder ? (
                      <div className="text-center">
                        <div className="text-xs text-gray-500">
                          {table.currentOrder.items?.length || 0} itens
                        </div>
                        <div className="text-sm font-semibold mt-1 text-blue-600">
                          € {orderTotal.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Disponível</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 rounded-full bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
                >
                  <IoIosArrowBack className="h-4 w-4" />
                </motion.button>
                
                <span className="text-sm text-gray-600">
                  Página {currentPage + 1} de {totalPages}
                </span>
                
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="p-2 rounded-full bg-gray-100 disabled:opacity-50 hover:bg-gray-200"
                >
                  <IoIosArrowForward className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Nenhuma mesa encontrada com este filtro
          </div>
        )}
      </div>
    </div>
  );

  // Renderização do modal de histórico
  const renderHistoryModal = () => {
    const filteredOrders = filteredHistory();
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || calculateOrderTotal(order)), 0);
    const averageOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Histórico de Pedidos</h3>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowHistoryModal(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </motion.button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Filtros e estatísticas */}
            <div className="w-full md:w-72 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">De</label>
                      <input
                        type="date"
                        value={historyDateRange.start.toISOString().split('T')[0]}
                        onChange={(e) => setHistoryDateRange(prev => ({
                          ...prev,
                          start: new Date(e.target.value)
                        }))}
                        className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Até</label>
                      <input
                        type="date"
                        value={historyDateRange.end.toISOString().split('T')[0]}
                        onChange={(e) => setHistoryDateRange(prev => ({
                          ...prev,
                          end: new Date(e.target.value)
                        }))}
                        className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pesquisar</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Mesa, item, etc."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg text-xs sm:text-sm"
                    />
                    <FaSearch className="absolute left-2.5 top-3 text-gray-400 text-sm" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-2 sm:mb-3">Estatísticas</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <div className="text-xs text-blue-600">Pedidos</div>
                      <div className="text-lg font-bold">{filteredOrders.length}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <div className="text-xs text-purple-600">Ticket Médio</div>
                      <div className="text-lg font-bold">€ {averageOrderValue.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg col-span-2">
                      <div className="text-xs text-green-600">Total Arrecadado</div>
                      <div className="text-lg font-bold">€ {totalRevenue.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lista de pedidos */}
            <div className="flex-1 overflow-y-auto">
              {historyLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const orderTotal = order.total || calculateOrderTotal(order);
                    
                    return (
                      <motion.div 
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                                order.tableId >= 1 && order.tableId <= 16 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                Mesa {order.tableId} ({order.tableId >= 1 && order.tableId <= 16 ? 'Interna' : 'Externa'})
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(order.closedAt).toLocaleString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Fechado por: <span className="font-medium">{order.closedBy || 'Sistema'}</span>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <div className="text-lg font-bold text-green-600">€ {orderTotal.toFixed(2)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-500 mb-1">ITENS ({order.items?.length || 0})</div>
                          <div className="space-y-2">
                            {order.items?.map(item => (
                              <div key={`${order.id}-${item.id}-${item.addedAt}`} className="flex justify-between text-xs sm:text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-gray-500">{item.quantity}x</span>
                                  <div>
                                    <div>{item.nome}</div>
                                    {item.options && Object.entries(item.options).map(([optionKey, optionValue]) => {
                                      const optionConfig = menu[item.category]?.itens?.find(i => i.id === item.id)?.opcoes?.[optionKey];
                                      if (optionConfig) {
                                        if (Array.isArray(optionValue)) {
                                          return optionValue.map(val => {
                                            const optionItem = optionConfig.itens.find(i => i.valor === val);
                                            return optionItem && (
                                              <div key={val} className="text-xs text-gray-500">- {optionItem.label}</div>
                                            );
                                          });
                                        } else {
                                          const optionItem = optionConfig.itens.find(i => i.valor === optionValue);
                                          return optionItem && (
                                            <div key={optionValue} className="text-xs text-gray-500">- {optionItem.label}</div>
                                          );
                                        }
                                      }
                                      return null;
                                    })}
                                    {item.notes && (
                                      <div className="text-xs text-gray-500">Obs: {item.notes}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-gray-700 font-medium">
                                  € {(item.price * (item.quantity || 1)).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-700 mt-2">Nenhum pedido encontrado</h3>
                  <p className="mt-1 text-sm">Ajuste os filtros para ver os resultados</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Renderização do modal para adicionar itens
  const renderAddItemModal = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {selectedMenuItem ? (customizingItem ? 'Personalizar Item' : selectedMenuItem.nome) : 'Adicionar Item'}
          </h3>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowAddItemModal(false);
              setSelectedMenuItem(null);
              setSearchTerm('');
              setShowSearchResults(false);
              setCustomizingItem(false);
            }}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="h-5 w-5" />
          </motion.button>
        </div>
        
        {!selectedMenuItem ? (
          <div className="p-4">
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar itens..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value.trim()) {
                      const results = [];
                      Object.entries(menu).forEach(([category, categoryData]) => {
                        categoryData.itens.forEach(item => {
                          if (item.nome.toLowerCase().includes(e.target.value.toLowerCase())) {
                            results.push({
                              ...item,
                              category: category
                            });
                          }
                        });
                      });
                      setSearchResults(results);
                      setShowSearchResults(true);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {showSearchResults ? (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700 mb-2">Resultados da pesquisa:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.map(item => (
                    <motion.button
                      key={`${item.category}-${item.id}`}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedMenuItem(item);
                        setActiveMenuTab(item.category);
                      }}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 rounded-lg w-12 h-12 flex items-center justify-center">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{item.nome}</h4>
                          <p className="text-sm text-gray-500">{item.descricao}</p>
                          <div className="mt-1 text-blue-600 font-medium">€ {item.preco.toFixed(2)}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex overflow-x-auto pb-2 gap-1">
                  {Object.entries(menu).map(([category, categoryData]) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveMenuTab(category)}
                      className={`px-3 py-1.5 rounded-full whitespace-nowrap flex items-center gap-2 ${
                        activeMenuTab === category
                          ? 'bg-blue-100 text-blue-800 font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {getCategoryIcon(category)}
                      {categoryData.nome}
                    </motion.button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menu[activeMenuTab]?.itens?.map(item => (
                    <motion.button
                      key={item.id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMenuItem(item)}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 rounded-lg w-12 h-12 flex items-center justify-center">
                          {getCategoryIcon(activeMenuTab)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{item.nome}</h4>
                          <p className="text-sm text-gray-500">{item.descricao}</p>
                          <div className="mt-1 text-blue-600 font-medium">€ {item.preco.toFixed(2)}</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : customizingItem ? (
          <div className="p-4 md:p-6">
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCustomizingItem(false)}
              className="flex items-center text-blue-600 mb-4 text-sm font-medium"
            >
              <FaChevronLeft className="h-3 w-3 mr-1" />
              Voltar para o item
            </motion.button>
            
            <div className="mb-6">
              <h4 className="font-bold text-lg text-gray-800 mb-1">{selectedMenuItem.nome}</h4>
              <p className="text-gray-600 text-sm">{selectedMenuItem.descricao}</p>
            </div>

            <div className="space-y-6">
              {selectedMenuItem.opcoes && Object.entries(selectedMenuItem.opcoes).map(([optionKey, optionConfig]) => (
                <div key={optionKey} className="bg-white rounded-lg border border-gray-200 p-4">
                  <label className="block text-gray-700 mb-3 font-medium">
                    {optionConfig.titulo}
                    {optionConfig.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  <div className="space-y-3">
                    {optionConfig.itens.map(item => (
                      <label 
                        key={item.valor} 
                        className={`flex items-start p-3 rounded-lg border transition-colors ${
                          (optionConfig.tipo === 'radio' && selectedOptions[optionKey] === item.valor) ||
                          (optionConfig.tipo === 'checkbox' && (selectedOptions[optionKey] || []).includes(item.valor))
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {optionConfig.tipo === 'radio' ? (
                          <input
                            type="radio"
                            name={optionKey}
                            checked={selectedOptions[optionKey] === item.valor}
                            onChange={() => handleOptionChange(optionKey, item.valor)}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={(selectedOptions[optionKey] || []).includes(item.valor)}
                            onChange={() => handleOptionChange(optionKey, item.valor, true)}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                        )}
                        <div className="ml-3 flex-1">
                          <span className="text-gray-700">{item.label}</span>
                          {item.preco && (
                            <span className="block text-sm text-blue-600 mt-1">
                              +€{item.preco.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-gray-700 mb-3 font-medium">Quantidade:</label>
                <div className="flex items-center gap-3 max-w-xs mx-auto">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNewItemQuantity(prev => Math.max(1, prev - 1))}
                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-300"
                  >
                    <FaMinus className="text-gray-600" />
                  </motion.button>
                  <div className="flex-1 text-center border border-gray-300 rounded-lg py-2 bg-white font-medium">
                    {newItemQuantity}
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNewItemQuantity(prev => prev + 1)}
                    className="w-10 h-10 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-300"
                  >
                    <FaPlus className="text-gray-600" />
                  </motion.button>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-gray-700 mb-2 font-medium">Observações:</label>
                <textarea
                  value={itemNotes[selectedMenuItem.id] || ''}
                  onChange={(e) => setItemNotes(prev => ({
                    ...prev,
                    [selectedMenuItem.id]: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Ex: Sem cebola, bem passado, etc."
                  rows={3}
                />
              </div>
              
              <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Subtotal</p>
                  <p className="text-lg font-bold text-blue-600">
                    € {(selectedMenuItem.preco * newItemQuantity).toFixed(2)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={addItemToOrder}
                  className="px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium"
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : 'Confirmar'}
                </motion.button>
              </div>
            </div>
          </div>
        ) : (
          /* Visualização do item antes da personalização */
          <div className="p-4 md:p-6">
            <motion.button
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMenuItem(null);
                setSearchTerm('');
                setShowSearchResults(false);
              }}
              className="flex items-center text-blue-600 mb-4"
            >
              <FaChevronLeft className="h-4 w-4 mr-1" />
              Voltar para o menu
            </motion.button>
            
            <div className="flex flex-col md:flex-row gap-6 mb-6">
              <div className="w-full md:w-1/3">
                <div className="bg-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center">
                  {getCategoryIcon(activeMenuTab)}
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-xl text-gray-800 mb-2">{selectedMenuItem.nome}</h4>
                {selectedMenuItem.descricao && (
                  <p className="text-gray-600 mb-4">{selectedMenuItem.descricao}</p>
                )}
                
                {selectedMenuItem.opcoes && (
                  <div className="mb-6">
                    <p className="text-gray-700 mb-2">
                      Este item possui opções de personalização disponíveis.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCustomizingItem(true)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                    >
                      Personalizar Item
                    </motion.button>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <label className="block text-gray-700 mb-3 font-medium">Quantidade:</label>
                  <div className="flex items-center gap-3">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNewItemQuantity(prev => Math.max(1, prev - 1))}
                      className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-300 text-xl"
                    >
                      <FaMinus />
                    </motion.button>
                    <input
                      type="number"
                      min="1"
                      value={newItemQuantity}
                      onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 text-center border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                    />
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setNewItemQuantity(prev => prev + 1)}
                      className="w-12 h-12 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-300 text-xl"
                    >
                      <FaPlus />
                    </motion.button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2 font-medium">Observações:</label>
                  <textarea
                    value={itemNotes[selectedMenuItem.id] || ''}
                    onChange={(e) => setItemNotes(prev => ({
                      ...prev,
                      [selectedMenuItem.id]: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Sem cebola, bem passado, etc."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-between items-center bg-gray-50 rounded-xl p-4 mb-6">
                  <span className="font-medium text-gray-700">Subtotal:</span>
                  <span className="text-xl font-bold text-blue-600">
                    € {(selectedMenuItem.preco * newItemQuantity).toFixed(2)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedMenuItem(null);
                      setSearchTerm('');
                      setShowSearchResults(false);
                    }}
                    className="px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 font-medium"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (selectedMenuItem.opcoes) {
                        setCustomizingItem(true);
                      } else {
                        addItemToOrder();
                      }
                    }}
                    className="px-4 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      selectedOrder?.id ? 'Adicionar ao Pedido' : 'Criar Novo Pedido'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  // Renderização do modal de fechamento de comanda
 const renderCloseOrderModal = () => {
  // Verifica se existe um pedido selecionado
  if (!selectedOrder) return null;

  const table = tables.find(t => t.id === selectedTable);
  const tableName = `Mesa ${selectedTable} (${table?.type === 'interna' ? 'Interna' : 'Externa'})`;
  const orderTotal = calculateOrderTotal(selectedOrder);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Fechar Comanda - {tableName}</h3>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCloseOrderModal(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </motion.button>
          </div>
          
          <div className="p-4">
            <div className="mb-6">
              <h4 className="font-bold text-lg text-gray-800 mb-3">Resumo do Pedido</h4>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Número do Pedido:</span>
                  <span className="font-medium text-blue-600">{selectedOrder.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Data/Hora:</span>
                  <span className="text-gray-600">
                    {new Date(selectedOrder.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b flex justify-between font-medium text-gray-700">
                  <span>Itens</span>
                  <span>Total</span>
                </div>
                
                <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                  {selectedOrder.items?.map(item => (
                    <div key={`${item.id}-${item.addedAt}`} className="px-4 py-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.quantity}x {item.nome}
                          </p>
                          {item.options && Object.entries(item.options).map(([optionKey, optionValue]) => {
                            const optionConfig = menu[item.category]?.itens?.find(i => i.id === item.id)?.opcoes?.[optionKey];
                            if (optionConfig) {
                              if (Array.isArray(optionValue)) {
                                return optionValue.map(val => {
                                  const optionItem = optionConfig.itens.find(i => i.valor === val);
                                  return optionItem && (
                                    <div key={val} className="text-xs text-gray-600">- {optionItem.label}</div>
                                  );
                                });
                              } else {
                                const optionItem = optionConfig.itens.find(i => i.valor === optionValue);
                                return optionItem && (
                                  <div key={optionValue} className="text-xs text-gray-600">- {optionItem.label}</div>
                                );
                              }
                            }
                            return null;
                          })}
                          {item.notes && (
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="font-semibold">Obs:</span> {item.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-blue-600 font-medium">
                            € {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 border-t flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">€ {orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
                   
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCloseOrderModal(false)}
                className="px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md flex items-center justify-center gap-2 border border-gray-300 font-medium"
              >
                <FaChevronLeft className="h-4 w-4" />
                Voltar
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={closeOrder}
                disabled={isClosingOrder}
                className="px-4 py-3 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all hover:shadow-md flex items-center justify-center gap-2 font-medium"
              >
                {isClosingOrder ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FaCheck className="h-5 w-5" />
                )}
                Confirmar Fechamento
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Renderização dos detalhes da mesa
  const renderTableDetailsModal = () => {
    const table = tables.find(t => t.id === selectedTable);
    const tableName = `Mesa ${selectedTable} (${table?.type === 'interna' ? 'Interna' : 'Externa'})`;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">{tableName}</h3>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowTableDetailsModal(false);
                setSelectedTable(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="h-5 w-5" />
            </motion.button>
          </div>
          
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
            {selectedOrder ? (
              <>
                {/* Seção de itens do pedido */}
                <div className="space-y-3 mb-6">
                  {selectedOrder.items?.length > 0 ? (
                    selectedOrder.items.map((item) => {
                      const isPrinted = printedItems[`${selectedTable}-${item.id}-${item.addedAt || ''}`] || item.printed;

                      return (
                        <motion.div
                          key={`${item.id}-${item.addedAt || ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-lg border ${
                            isPrinted
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm'
                          } transition-all duration-200`}
                        >
                          <div className="flex items-center gap-3 mb-2 sm:mb-0 w-full sm:w-auto">
                            {!isPrinted && (
                              <motion.span 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Novo!
                              </motion.span>
                            )}
                            <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {getCategoryIcon(item.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${isPrinted ? 'text-gray-600' : 'text-gray-800'}`}>
                                {item.quantity}x {item.nome}
                              </p>
                              {item.options && Object.entries(item.options).map(([optionKey, optionValue]) => {
                                const optionConfig = menu[item.category]?.itens?.find(i => i.id === item.id)?.opcoes?.[optionKey];
                                if (optionConfig) {
                                  if (Array.isArray(optionValue)) {
                                    return optionValue.map(val => {
                                      const optionItem = optionConfig.itens.find(i => i.valor === val);
                                      return optionItem && (
                                        <div key={val} className="text-xs text-gray-600">- {optionItem.label}</div>
                                      );
                                    });
                                  } else {
                                    const optionItem = optionConfig.itens.find(i => i.valor === optionValue);
                                    return optionItem && (
                                      <div key={optionValue} className="text-xs text-gray-600">- {optionItem.label}</div>
                                    );
                                  }
                                }
                                return null;
                              })}
                              {item.notes && (
                                <div className="text-xs text-gray-600 mt-1 bg-white px-2 py-1 rounded">
                                  <span className="font-semibold">Obs:</span> {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between w-full sm:w-auto sm:gap-3">
                            <div className="flex items-center bg-white rounded-lg px-2 py-1 border border-gray-300">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateItemQuantity(item.id, (item.quantity || 1) - 1)
                                }
                                className="text-gray-500 hover:text-blue-600 w-6 h-6 flex items-center justify-center"
                              >
                                <FaMinus className="text-xs" />
                              </motion.button>
                              <span className="text-sm font-medium w-6 text-center">
                                {item.quantity || 1}
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() =>
                                  updateItemQuantity(item.id, (item.quantity || 1) + 1)
                                }
                                className="text-gray-500 hover:text-blue-600 w-6 h-6 flex items-center justify-center"
                              >
                                <FaPlus className="text-xs" />
                              </motion.button>
                            </div>

                            <span className="text-blue-600 font-semibold min-w-[60px] text-right">
                              € {(item.price * (item.quantity || 1)).toFixed(2)}
                            </span>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeItemFromOrder(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 sm:p-2 rounded-full hover:bg-red-50 transition-colors ml-2"
                            >
                              <FaTimes className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 p-5 rounded-full inline-block mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Mesa vazia
                      </h3>
                      <p className="text-gray-500 mb-4">Adicione itens para começar</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowAddItemModal(true);
                          setShowTableDetailsModal(false);
                        }}
                        className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <FaPlus />
                        Adicionar Itens
                      </motion.button>
                    </div>
                  )}
                </div>

                {selectedOrder.items?.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        € {calculateOrderTotal(selectedOrder).toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowAddItemModal(true);
                          setShowTableDetailsModal(false);
                        }}
                        className="bg-white text-blue-600 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md flex items-center justify-center gap-2 border border-gray-200 font-medium"
                      >
                        <FaPlus />
                        Adicionar Mais
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={printOrder}
                        disabled={isPrinting || !hasUnprintedItems(selectedOrder)}
                        className={`px-4 py-3 rounded-lg transition-all hover:shadow-md flex items-center justify-center gap-2 font-medium ${
                          isPrinting || !hasUnprintedItems(selectedOrder)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-br from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                        }`}
                      >
                        {isPrinting ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Imprimindo...
                          </>
                        ) : (
                          <>
                            <BsPrinter className="h-5 w-5" />
                            Enviar para Impressão
                          </>
                        )}
                      </motion.button>

                      <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectedOrder && setShowCloseOrderModal(true)}
                      className="px-4 py-3 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all hover:shadow-md flex items-center justify-center gap-2 font-medium"
                    >
                      <FaCheck className="h-5 w-5" />
                      Fechar Mesa
                    </motion.button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="bg-gray-100 p-5 rounded-full inline-block mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Nenhum pedido ativo
                </h3>
                <p className="text-gray-500 mb-4">Comece criando um novo pedido</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowAddItemModal(true);
                    setShowTableDetailsModal(false);
                  }}
                  className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-3 mx-auto text-lg"
                >
                  <FaPlus />
                  Criar Novo Pedido
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Renderização do conteúdo principal
  const renderMainContent = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Notificações */}
      {error && (
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center animate-fade-in"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setError(null)} 
            className="ml-4 p-1 rounded-full hover:bg-red-600 transition-colors"
          >
            <FaTimes className="h-5 w-5" />
          </motion.button>
        </motion.div>
      )}

      {/* Loader */}
      {(loading || isPrinting || isClosingOrder) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
        >
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium text-gray-700">Processando...</span>
          </div>
        </motion.div>
      )}

      {renderHeader()}

      <div className="container mx-auto flex flex-col md:flex-row">
        {renderTableTabs()}
        
        <main className="flex-1 p-4 bg-gray-50 min-h-[calc(100vh-4rem)]">
          {!selectedTable && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center flex flex-col items-center justify-center h-[60vh]"
            >
              <div className="bg-gray-100 p-6 rounded-full inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 5h18M3 12h18M3 19h18" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Selecione uma mesa</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Escolha uma mesa no painel lateral para visualizar e gerenciar os pedidos
              </p>
              <div className="w-12 h-1 bg-gray-200 rounded-full mb-6"></div>
              <p className="text-sm text-gray-400">
                Toque em uma mesa para começar
              </p>
            </motion.div>
          )}
        </main>
      </div>
  
      {/* Modais */}
      <AnimatePresence>
        {showAddItemModal && renderAddItemModal()}
        {showHistoryModal && renderHistoryModal()}
        {showTableDetailsModal && renderTableDetailsModal()}
        {showCloseOrderModal && renderCloseOrderModal()}
      </AnimatePresence>
    </div>
  );

  return !isAuthenticated ? renderLogin() : renderMainContent();
}

export default AdminPanel;