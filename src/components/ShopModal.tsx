import React, { useState } from 'react';
import { Item, Champion } from '../types/game';
import { ITEMS } from '../game/constants';
import { X, ShoppingBag, Coins, Shield, Swords, Sparkles, Zap, ArrowRight } from 'lucide-react';

interface ShopModalProps {
  player: Champion;
  isOpen: boolean;
  onClose: () => void;
  onBuyItem: (item: Item) => boolean;
  onSellItem: (index: number) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  player,
  isOpen,
  onClose,
  onBuyItem,
  onSellItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'starter' | 'attack' | 'magic' | 'defense' | 'boots'>('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(ITEMS[0]);

  if (!isOpen) return null;

  const filteredItems = selectedCategory === 'all'
    ? ITEMS
    : ITEMS.filter((item) => item.category === selectedCategory);

  const canAfford = selectedItem && player.gold >= selectedItem.cost;
  const hasFreeSlot = player.items.some((slot) => slot === null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-950 border border-amber-600/50 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-cinzel text-amber-300">상점 (P)</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/40 rounded-full text-amber-300 text-sm font-mono-numbers font-bold">
              <span>🪙</span>
              <span>{player.gold} 골드</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Categories + Items Grid + Details & Inventory */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Category Nav */}
          <div className="w-44 border-r border-slate-800 p-3 flex flex-col gap-1 bg-slate-900/30">
            <span className="text-[11px] font-semibold text-slate-400 px-3 py-1 uppercase">카테고리</span>
            {[
              { id: 'all', label: '전체 아이템' },
              { id: 'starter', label: '시작 아이템' },
              { id: 'attack', label: '공격력 / 치명타' },
              { id: 'magic', label: '주문력 (마법)' },
              { id: 'defense', label: '방어 / 체력' },
              { id: 'boots', label: '신발' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Center: Items Grid */}
          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-3 gap-3 content-start">
            {filteredItems.map((item) => {
              const affordable = player.gold >= item.cost;
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/30 shadow-lg scale-[1.02]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl p-2 bg-slate-800/80 rounded-lg border border-slate-700">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">{item.nameKr}</h4>
                      <span className="text-[11px] text-slate-400">{item.name}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className={`text-xs font-mono-numbers font-bold flex items-center gap-1 ${affordable ? 'text-amber-400' : 'text-slate-500'}`}>
                      <span>🪙</span>
                      <span>{item.cost}</span>
                    </span>
                    {item.passiveNameKr && (
                      <span className="text-[10px] text-purple-400 font-medium">{item.passiveNameKr}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Item Detail & Current Inventory */}
          <div className="w-72 border-l border-slate-800 p-4 flex flex-col justify-between bg-slate-900/40">
            {selectedItem ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-4xl p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                    {selectedItem.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-amber-300">{selectedItem.nameKr}</h3>
                    <div className="text-xs text-amber-400 font-mono-numbers font-bold flex items-center gap-1">
                      <span>🪙</span>
                      <span>{selectedItem.cost} 골드</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <p>{selectedItem.descriptionKr}</p>
                </div>

                {/* Stats Breakdown */}
                <div className="flex flex-col gap-1 text-xs">
                  {selectedItem.ad && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-amber-400">공격력</span>
                      <span className="font-bold font-mono-numbers">+{selectedItem.ad}</span>
                    </div>
                  )}
                  {selectedItem.ap && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-purple-400">주문력</span>
                      <span className="font-bold font-mono-numbers">+{selectedItem.ap}</span>
                    </div>
                  )}
                  {selectedItem.hp && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-emerald-400">체력</span>
                      <span className="font-bold font-mono-numbers">+{selectedItem.hp}</span>
                    </div>
                  )}
                  {selectedItem.armor && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-amber-200">방어력</span>
                      <span className="font-bold font-mono-numbers">+{selectedItem.armor}</span>
                    </div>
                  )}
                  {selectedItem.attackSpeed && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-yellow-300">공격 속도</span>
                      <span className="font-bold font-mono-numbers">+{(selectedItem.attackSpeed * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {selectedItem.moveSpeed && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-emerald-300">이동 속도</span>
                      <span className="font-bold font-mono-numbers">+{selectedItem.moveSpeed}</span>
                    </div>
                  )}
                  {selectedItem.critChance && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-red-400">치명타 확률</span>
                      <span className="font-bold font-mono-numbers">+{selectedItem.critChance}%</span>
                    </div>
                  )}
                </div>

                {/* Buy Button */}
                <button
                  disabled={!canAfford || !hasFreeSlot}
                  onClick={() => onBuyItem(selectedItem)}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all ${
                    canAfford && hasFreeSlot
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {!hasFreeSlot
                    ? '가방이 가득 찼습니다'
                    : !canAfford
                    ? '골드가 부족합니다'
                    : '아이템 구매'}
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 text-xs py-8">
                아이템을 선택하세요
              </div>
            )}

            {/* Current Inventory with Sell action */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">보유 중인 아이템 (클릭 시 판매)</span>
              <div className="grid grid-cols-6 gap-1.5">
                {player.items.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => item && onSellItem(idx)}
                    className="w-10 h-10 rounded border border-slate-700 bg-slate-950 flex items-center justify-center text-base cursor-pointer hover:border-red-400 transition-colors relative group"
                    title={item ? `${item.nameKr} (판매 시 +${Math.round(item.cost * 0.7)}G)` : '빈 슬롯'}
                  >
                    {item ? item.icon : <span className="text-slate-700 text-xs">{idx + 1}</span>}
                    {item && (
                      <span className="hidden group-hover:block absolute -top-6 text-[9px] bg-red-950 text-red-200 px-1 py-0.5 rounded border border-red-500 whitespace-nowrap">
                        판매
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
