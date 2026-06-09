/**
 * Aura Antique - Premium Antique Showroom JS
 * Features: Product loading, filtering, detail modal with image gallery, SKU copy functionality, mobile navigation.
 */

// 1. Product Database (Premium Antique Masterpieces)
const productsData = [
  {
    id: 1,
    sku: "ART-001",
    category: "ceramics",
    status: "available", // available, reserved, sold
    title: "조선 백자 달항아리",
    era: "18세기 조선 후기",
    size: "높이 42.5cm, 몸통 지름 41.0cm",
    condition: "A+ (보존 상태 최상, 구연부 미세 알트임 외 완벽)",
    summary: "넉넉하고 둥근 형태와 백색의 고유한 깊이가 어우러져 한국적인 절제미의 극치를 보여주는 백자 달항아리입니다.",
    description: "본 작품은 18세기 조선 후기에 제작된 백자 달항아리입니다. 완벽한 구형이 아닌 자연스럽고 비대칭적인 둥근 멋이 살아있어 바라보는 각도에 따라 각기 다른 미감을 선사합니다. 태토의 순백색과 광택이 잘 보존되어 있으며, 당시 관요에서 생산된 최상급 백자의 특징인 맑고 은은한 유백색 유약의 흐름을 관찰할 수 있습니다. 개인 소장용 및 공간의 품격을 높이는 인테리어 오브제로 가치가 대단히 높습니다.",
    images: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800",
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=800"
    ]
  },
  {
    id: 2,
    sku: "FUR-002",
    category: "furniture",
    status: "available",
    title: "19세기 영국 오크 뷰로 데스크",
    era: "1880년대 빅토리아 시대",
    size: "폭 95cm, 깊이 48cm, 높이 102cm",
    condition: "A (오리지널 브라스 피팅 및 경첩 완동, 세월에 따른 자연스러운 태닝)",
    summary: "빅토리아 시대 후기에 제작된 고급 솔리드 오크 소재의 쓰기용 책상(Bureau)입니다.",
    description: "영국 빅토리아 여왕 치세 후기인 1880년대에 제작된 클래식 오크 뷰로 데스크입니다. 단단하고 결이 아름다운 영국산 오크 원목을 사용하여 오랜 세월에도 변형 없이 견고함을 유지하고 있습니다. 상단의 경사 덮개를 열면 가죽 라이닝 마감된 확장 데스크가 나타나며, 내부에는 편지 및 문서를 수납할 수 있는 아기자기한 파티션과 시크릿 서랍이 마련되어 있습니다. 하단의 대형 3단 서랍은 넉넉한 수납을 제공하며 손잡이와 열쇠구멍의 오리지널 황동 브라스 디테일이 고급스러움을 더합니다.",
    images: [
      "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?q=80&w=800",
      "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?q=80&w=800"
    ]
  },
  {
    id: 3,
    sku: "ART-003",
    category: "artworks",
    status: "reserved",
    title: "조선 후기 책거리 8폭 병풍 (일부)",
    era: "19세기 조선 말기",
    size: "각 폭 45cm x 120cm (총 가로길이 약 360cm)",
    condition: "B+ (부분적인 배접 보완 완료, 채색 보존 양호)",
    summary: "선비의 서책과 기물들을 다채롭게 묘사하여 학업 성취와 집안의 번창을 기원하는 민화 병풍입니다.",
    description: "학문과 예술을 숭상하던 조선 사대부들의 취향을 반영한 19세기 책거리(책가도) 병풍입니다. 서책을 비롯해 도자기, 문방사우, 향로, 과일 등이 입체적인 역원근법과 다채로운 진채 기법으로 묘사되어 있습니다. 당시 유행하던 길상적 의미(다산, 관직 등용, 장수)가 가득 차 있어 장식성이 매우 뛰어나며, 현대적인 공간에도 동양적인 신비로움과 지적인 깊이를 불어넣어 줍니다. 보존 처리가 완료되어 바로 사용하실 수 있습니다.",
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800"
    ]
  },
  {
    id: 4,
    sku: "COL-004",
    category: "collectibles",
    status: "available",
    title: "18세기 루이 15세 양식 황동 3구 촛대 (한 쌍)",
    era: "1760년대 프랑스",
    size: "높이 38cm, 가로폭 22cm (한 쌍)",
    condition: "A (정밀 금속 세척 및 마이크로왁스 보존 처리 완료, 오리지널 무드로 유지)",
    summary: "화려한 로코코 양식의 유려한 곡선미가 돋보이는 프랑스 오리지널 길트 브론즈 촛대 한 쌍입니다.",
    description: "프랑스 루이 15세 치하(1760년대) 로코코 미술의 정수를 담은 오리지널 황동 촛대 2점(1세트)입니다. 조개껍데기 문양(Rocaille)과 잎사귀, 나선형 스크롤 곡선이 유기적으로 어우러져 화려하면서도 우아한 비주얼을 자랑합니다. 불을 켜지 않아도 황동 고유의 깊은 금빛이 어두운 공간에서 묵직한 존재감을 드러냅니다. 다이닝 테이블 중앙이나 콘솔 위에 대칭으로 연출하기에 이상적인 수집 가치 최상급의 앤티크입니다.",
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800",
      "https://images.unsplash.com/photo-1606744837616-a6e975a66b4d?q=80&w=800"
    ]
  },
  {
    id: 5,
    sku: "CER-005",
    category: "ceramics",
    status: "sold",
    title: "고려청자 양각 연판문 대접",
    era: "12세기 고려 시대 전성기",
    size: "입지름 16.2cm, 밑지름 5.5cm, 높이 6.8cm",
    condition: "A- (구연부 미세 수리 존재하나 유색과 문양이 대단히 수려함)",
    summary: "비색 청자의 아름다움을 유감없이 뽐내는 고려 12세기 전성기 청자 대접입니다.",
    description: "12세기 전라남도 강진 사당리 가마터 부근에서 구워진 것으로 추정되는 고려청자 대접입니다. 은은하고 맑은 비색(翡色)의 유약 아래로 연꽃잎 모양(연판문)이 입체감 있게 양각되어 있습니다. 빛을 받을 때 투명하고 푸른 광채가 연판의 굴곡을 따라 부드럽게 강조되어 고려 귀족 문화의 화려하고도 단아한 미의식을 체감할 수 있습니다. 아쉽게도 테두리 부분에 오랜 세월의 흔적으로 인한 보수가 미세하게 있으나 전체 형태와 비색이 뛰어나 소장 가치가 보장됩니다.",
    images: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800",
      "https://images.unsplash.com/photo-1525974738370-1798a3cc0d96?q=80&w=800"
    ]
  },
  {
    id: 6,
    sku: "COL-006",
    category: "collectibles",
    status: "available",
    title: "19세기 제네바 브론즈 포켓 워치",
    era: "1890년대 스위스",
    size: "지름 5.2cm, 두께 1.5cm (줄 길이 제외)",
    condition: "B+ (수동 태엽 무브먼트 오버홀 완료, 실사용 가능)",
    summary: "정교한 인그레이빙 데코 케이스가 특징인 스위스 제네바산 빈티지 회중시계입니다.",
    description: "19세기 말 스위스 제네바의 장인에 의해 정밀 제작된 빈티지 브론즈 회중시계입니다. 뒷면에는 당시의 목가적인 풍경이 정교한 부조(인그레이빙)로 묘사되어 있으며, 다이얼은 깨끗한 에나멜 화이트 바탕에 로마자 인덱스가 클래식하게 수놓아져 있습니다. 기계식 태엽(Wind-up) 방식으로 작동하며 최근 시계 전문 공방에서 내부 세척 및 윤활 처리를 거쳐 기어의 째깍거리는 맑은 작동음과 함께 정확한 시간 측정이 가능합니다. 클래식 슈트의 베스트 포켓에 매치하거나 서재 테이블 위에 연출하기에 훌륭합니다.",
    images: [
      "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=800",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=800"
    ]
  },
  {
    id: 7,
    sku: "FUR-007",
    category: "furniture",
    status: "available",
    title: "조선 말기 강화 반닫이",
    era: "19세기 말 조선 시대",
    size: "가로 88cm, 세로 42cm, 높이 78cm",
    condition: "A (오리지널 무쇠 장식 및 자물쇠 원형 유지, 느릅나무 원목)",
    summary: "강화도 전통 양식에 따라 숭숭이 무쇠 장식과 견고한 짜임새로 완성된 최고급 가구입니다.",
    description: "조선 시대 말기 강화도 지역에서 제작된 오리지널 강화 반닫이입니다. 습기에 강하고 단단한 느릅나무와 오동나무를 혼용하였으며 앞면 전체를 덮고 있는 정교한 구멍 뚫린 숭숭이 무쇠 장식이 빛에 따라 묵직한 카리스마를 자아냅니다. 경판을 맞물려 짜는 사개물림 등 전통 기법이 온전히 보존되어 문을 여닫을 때도 정밀한 아귀가 맞아떨어집니다. 고색(Patina)이 아름답게 앉은 수작으로 동양 전통 인테리어의 품격 높은 무게중심을 잡아주는 명품 가구입니다.",
    images: [
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=800",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800"
    ]
  },
  {
    id: 8,
    sku: "ART-008",
    category: "artworks",
    status: "available",
    title: "19세기 이탈리아 르네상스 재현 유화",
    era: "1850년대 이탈리아",
    size: "캔버스 60cm x 80cm (프레임 포함 75cm x 95cm)",
    condition: "A (앤티크 오리지널 우드/금박 깃 프레임 보존 우수, 크랙 현상 자연스러움)",
    summary: "라파엘로 학풍을 풍부하게 재현한 19세기 이탈리아 살롱 풍의 고전주의 유화 작품입니다.",
    description: "19세기 중엽 이탈리아의 무명 화가가 르네상스 고전 회화의 양식을 동경하여 정교한 붓 터치로 재현해 낸 성모자 풍의 종교 미술 유화입니다. 은은하게 흘러내리는 명암법(치아로스쿠로)과 성스러운 인물 묘사가 격조 높은 평온함을 선사합니다. 함께 제공되는 나무 및 회반죽 재질의 화려한 오리지널 도금 액자(Gilt Frame)는 그 자체로 하나의 훌륭한 조각 예술품이며, 오랜 시간 동안 캔버스 위에 갈라진 천연 미세 크랙들이 앤티크 갤러리의 고고한 시간을 증명해 줍니다.",
    images: [
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800",
      "https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=800"
    ]
  }
];

// 2. Global State Variables
let currentFilters = {
  category: "all",
  status: "all"
};
let selectedProduct = null;
let currentImageIndex = 0;

// 3. Document Element References
const loader = document.getElementById("loader");
const header = document.getElementById("header");
const mobileSidebar = document.getElementById("mobileSidebar");
const menuBtn = document.querySelector(".mobile-menu-btn");
const closeSidebarBtn = document.querySelector(".sidebar-close-btn");
const sidebarLinks = document.querySelectorAll(".sidebar-link, .sidebar-cta");
const productGrid = document.getElementById("productGrid");
const categoryFilterBtns = document.querySelectorAll(".category-filters .filter-btn");
const statusFilterBtns = document.querySelectorAll(".status-filters .status-btn");

// Modal Elements
const productModal = document.getElementById("productModal");
const modalCloseBtn = document.querySelector(".modal-close-btn");
const modalMainImg = document.getElementById("modalMainImg");
const modalThumbnails = document.getElementById("modalThumbnails");
const modalBadge = document.getElementById("modalBadge");
const modalSku = document.getElementById("modalSku");
const modalTitle = document.getElementById("modalTitle");
const modalEra = document.getElementById("modalEra");
const modalSize = document.getElementById("modalSize");
const modalCondition = document.getElementById("modalCondition");
const modalDesc = document.getElementById("modalDesc");
const modalSkuCopyVal = document.getElementById("modalSkuCopyVal");
const btnCopySku = document.getElementById("btnCopySku");
const modalTelBtn = document.getElementById("modalTelBtn");
const toast = document.getElementById("toast");

// 4. Initial Loading Configuration
window.addEventListener("load", () => {
  // Graceful Loader Fade out
  setTimeout(() => {
    if (loader) {
      loader.classList.add("fade-out");
    }
  }, 1200);
});

// 5. Header Scroll Effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

// 6. Mobile Sidebar Menu Toggle
if (menuBtn && mobileSidebar) {
  menuBtn.addEventListener("click", () => {
    mobileSidebar.classList.add("open");
  });
}

if (closeSidebarBtn && mobileSidebar) {
  closeSidebarBtn.addEventListener("click", () => {
    mobileSidebar.classList.remove("open");
  });
}

sidebarLinks.forEach(link => {
  link.addEventListener("click", () => {
    if (mobileSidebar) {
      mobileSidebar.classList.remove("open");
    }
  });
});

// Close sidebar on clicking outside it
document.addEventListener("click", (e) => {
  if (
    mobileSidebar && 
    mobileSidebar.classList.contains("open") && 
    !mobileSidebar.contains(e.target) && 
    !menuBtn.contains(e.target)
  ) {
    mobileSidebar.classList.remove("open");
  }
});

// 7. Render Product List
function renderProducts() {
  if (!productGrid) return;
  
  productGrid.innerHTML = "";
  
  // Filter logic
  const filteredProducts = productsData.filter(product => {
    const categoryMatch = currentFilters.category === "all" || product.category === currentFilters.category;
    const statusMatch = currentFilters.status === "all" || product.status === currentFilters.status;
    return categoryMatch && statusMatch;
  });
  
  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="no-results">
        <i data-lucide="inbox"></i>
        <p>조건에 맞는 소장품이 존재하지 않습니다.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  filteredProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;
    
    // Status settings
    let statusText = "판매 중";
    let badgeClass = "badge-available";
    if (product.status === "reserved") {
      statusText = "예약 중";
      badgeClass = "badge-reserved";
    } else if (product.status === "sold") {
      statusText = "판매 완료";
      badgeClass = "badge-sold";
    }
    
    card.innerHTML = `
      <div class="card-img-wrapper">
        <span class="card-badge ${badgeClass}">${statusText}</span>
        <img src="${product.images[0]}" alt="${product.title}" loading="lazy">
      </div>
      <div class="card-info">
        <div class="card-header-info">
          <span>${product.era}</span>
          <span>${product.sku}</span>
        </div>
        <h4 class="card-title">${product.title}</h4>
        <p class="card-desc">${product.summary}</p>
        <div class="card-footer">
          <span class="card-action-text">
            <span>자세히 보기</span>
            <i data-lucide="chevron-right"></i>
          </span>
        </div>
      </div>
    `;
    
    // Click card to open modal
    card.addEventListener("click", () => {
      openModal(product);
    });
    
    productGrid.appendChild(card);
  });
  
  // Re-initialize dynamic Lucide icons
  lucide.createIcons();
}

// 8. Filters Interaction Setup
categoryFilterBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    categoryFilterBtns.forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentFilters.category = e.target.dataset.value;
    renderProducts();
  });
});

statusFilterBtns.forEach(btn => {
  btn.addEventListener("click", (e) => {
    statusFilterBtns.forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentFilters.status = e.target.dataset.value;
    renderProducts();
  });
});

// 9. Product Detail Modal Controls
function openModal(product) {
  selectedProduct = product;
  currentImageIndex = 0;
  
  // Sku and Badge Setup
  modalSku.textContent = `SKU: ${product.sku}`;
  modalSkuCopyVal.textContent = product.sku;
  modalTitle.textContent = product.title;
  modalEra.textContent = product.era;
  modalSize.textContent = product.size;
  modalCondition.textContent = product.condition;
  modalDesc.textContent = product.description;
  
  // Badge styling
  modalBadge.className = "product-badge";
  if (product.status === "available") {
    modalBadge.textContent = "판매 중";
    modalBadge.classList.add("badge-available");
  } else if (product.status === "reserved") {
    modalBadge.textContent = "예약 중";
    modalBadge.classList.add("badge-reserved");
  } else if (product.status === "sold") {
    modalBadge.textContent = "판매 완료";
    modalBadge.classList.add("badge-sold");
  }
  
  // Dynamic Dial Number Binding
  if (modalTelBtn) {
    modalTelBtn.href = `tel:02-123-4567`;
  }
  
  // Image Setup
  updateModalImages();
  
  // Display Modal
  if (productModal) {
    productModal.classList.add("open");
    document.body.style.overflow = "hidden"; // Prevent page scrolling
  }
}

function updateModalImages() {
  if (!selectedProduct || !modalMainImg || !modalThumbnails) return;
  
  // Set main image
  modalMainImg.src = selectedProduct.images[currentImageIndex];
  modalMainImg.alt = `${selectedProduct.title} - 이미지 ${currentImageIndex + 1}`;
  
  // Set thumbnails
  modalThumbnails.innerHTML = "";
  selectedProduct.images.forEach((imgUrl, idx) => {
    const thumb = document.createElement("div");
    thumb.className = `thumbnail-item ${idx === currentImageIndex ? "active" : ""}`;
    thumb.innerHTML = `<img src="${imgUrl}" alt="썸네일 ${idx + 1}">`;
    
    thumb.addEventListener("click", () => {
      currentImageIndex = idx;
      updateModalImages();
    });
    
    modalThumbnails.appendChild(thumb);
  });
}

function closeModal() {
  if (productModal) {
    productModal.classList.remove("open");
    document.body.style.overflow = ""; // Enable page scrolling
  }
  selectedProduct = null;
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeModal);
}

if (productModal) {
  productModal.addEventListener("click", (e) => {
    // Close modal if clicked outside the container
    if (e.target === productModal) {
      closeModal();
    }
  });
}

// Esc Key triggers modal close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    if (mobileSidebar) {
      mobileSidebar.classList.remove("open");
    }
  }
});

// 10. SKU Code Copy Action
if (btnCopySku) {
  btnCopySku.addEventListener("click", () => {
    if (!selectedProduct) return;
    
    const skuCode = selectedProduct.sku;
    
    navigator.clipboard.writeText(skuCode).then(() => {
      // Show Success Toast
      showToast();
    }).catch(err => {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = skuCode;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        showToast();
      } catch (err) {
        console.error("작품 번호 복사 실패:", err);
      }
      document.body.removeChild(textarea);
    });
  });
}

function showToast() {
  if (!toast) return;
  
  toast.classList.add("show");
  
  // Auto hide toast after 2.5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// 11. Initial Run
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();
});
