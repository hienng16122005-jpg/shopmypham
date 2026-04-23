/**
 * Q&H SKINLAB CLONE - ADVANCED LOGIC
 */

/// 1. DATA
// Tự động nhận diện: Nếu chạy ở máy thì gọi port 5000, nếu up Vercel thì gọi qua path /api
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : window.location.origin + '/api';

/** 2. STATE & GLOBALS (Khai báo duy nhất một lần ở đầu file) */
let isLoggedIn = !!localStorage.getItem('qh_token');
let currentUserName = localStorage.getItem('qh_userName') || '';
let cart = JSON.parse(localStorage.getItem('qh_cart')) || [];
let products = []; 
let filteredProducts = [];
let currentSlide = 0;
let currentCheckoutItems = []; 
let isDirectCheckout = false;

const BRAND_BANNERS = {
    'drceutics': 'https://tse1.mm.bing.net/th/id/OIP.OfyLfasSBQ7Dja8o83btaQHaNK?rs=1&pid=ImgDetMain&o=7&rm=3',
    'cocoon': 'https://the7.vn/wp-content/uploads/2024/08/Cac-san-pham-cua-Cocoon-hoan-toan-duoc-che-tao-tu-nguyen-lieu-thien-nhien-thuan-chay-tinh-khiet-va-an-toan-768x862.png',
    'anessa': 'https://tse2.mm.bing.net/th/id/OIP.ycvbSJjumqoI8uMfUS-dawHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    'la roche-posay': 'https://tse4.mm.bing.net/th/id/OIP.KOH318hculZu7fs-k0hRFAHaLH?rs=1&pid=ImgDetMain&o=7&rm=3',
    'b.o.m': 'https://media.hcdn.vn/catalog/product/s/o/son-li-b-o-m-808-do-dat-ban-gioi-han-2024-3-1g-1-1727926367_img_800x800_eb97c5_fit_center.jpg',
    'merzy': 'https://theme.hstatic.net/1000362438/1000729754/14/hg_img3.png?v=949'
};

/**
 * Hàm fetch API an toàn: Kiểm tra response.ok, log text() khi lỗi và chỉ parse JSON khi hợp lệ
 */
async function safeFetch(url, options = {}) {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
        let errorMessage = `Yêu cầu thất bại: ${response.status}`;
        if (contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } else {
            const errorText = await response.text();
            console.error(`API Error [${response.status}] tại ${url}:`, errorText.substring(0, 500));
            // Nếu trả về HTML (trang lỗi mặc định của host), hiển thị thông báo thân thiện hơn
            if (contentType.includes("text/html")) {
                errorMessage = `Lỗi hệ thống (${response.status}). Vui lòng kiểm tra lại endpoint API.`;
            } else {
                errorMessage = errorText || errorMessage;
            }
        }
        throw new Error(errorMessage);
    }

    if (contentType.includes("application/json")) {
        return await response.json();
    }
    
    // Chống gọi nhầm file tĩnh (HTML/JS) trả về 200 OK nhưng sai định dạng mong muốn
    if (contentType.includes("text/html")) {
        console.warn(`Cảnh báo: Nhận phản hồi HTML thay vì JSON tại ${url}. Kiểm tra cấu hình router.`);
        throw new Error("Phản hồi không hợp lệ từ máy chủ (HTML thay vì JSON)");
    }

    return await response.text();
}

// Chuyển DEFAULT_PRODUCTS lên đầu file (trước khi sử dụng)
const DEFAULT_PRODUCTS = [
{
  id: 1,
name: '[NEW DEW] Son Tint Bóng Merzy Dạng Thạch, Bền Màu, Lâu Trôi Cho Đôi Môi Căng Mọng, Ẩm Mịn The Watery Dew Tint',
brand: 'Merzy',
category: 'trang-diem-son-moi',
price: 179000,
oldPrice: 309000,
discount: '42%',
image: 'https://product.hstatic.net/1000006063/product/wd23_c168ab0ee2c24edda27693a18de15bb5_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/wd23_c168ab0ee2c24edda27693a18de15bb5_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/36_3232d9509c31426c9ea371625b3fc168_1024x1024.png',
'https://product.hstatic.net/1000006063/product/m13_1f176b01a3ef42f1ba6e7566e23a0ae5_1024x1024.jpg'
],
description: 'Son Tint Bóng Dạng Thạch, Bền Màu, Lâu Trôi Merzy The Watery Dew Tint là son tint đến từ thương hiệu Merzy. Lấy cảm hứng từ tinh thần Old Money, thiết kế vỏ son tối giản mà sang trọng, nổi bật với logo chữ M được nhấn nhá tinh tế nơi phần nắp. Cùng bảng màu đa dạng với 5 màu son best-seller của dòng Watery Dew Tint và 5 sắc màu hoàn toàn mới, trendy, phù hợp với nhiều tone da. Đặc biệt, chất son vẫn giữ nguyên công thức với kết cấu dạng thạch trong suốt, chất son bóng lì, ẩm mịn, bền màu, lâu trôi mang lại vẻ đẹp tự nhiên cho đôi môi căng bóng, rạng rỡ.',
details: 'Son Tint Bóng Dạng Thạch, Bền Màu, Lâu Trôi Merzy The Watery Dew Tint là son tint đến từ thương hiệu Merzy. Lấy cảm hứng từ tinh thần Old Money, thiết kế vỏ son tối giản mà sang trọng, nổi bật với logo chữ M được nhấn nhá tinh tế nơi phần nắp. Cùng bảng màu đa dạng với 5 màu son best-seller của dòng Watery Dew Tint và 5 sắc màu hoàn toàn mới, trendy, phù hợp với nhiều tone da. Đặc biệt, chất son vẫn giữ nguyên công thức với kết cấu dạng thạch trong suốt, chất son bóng lì, ẩm mịn, bền màu, lâu trôi mang lại vẻ đẹp tự nhiên cho đôi môi căng bóng, rạng rỡ.',
specs: {
'Tên sản phẩm': 'Merzy The Watery Dew Tint',
'Chất son': 'Son thạch, son tint, son bóng',
'Dung tích': '4g',
'Thương hiệu': 'Merzy (Hàn Quốc)',
'Nơi sản xuất': 'Hàn Quốc',
'Hạn sử dụng': '36 tháng kể từ ngày sản xuất in trên bao bì - 12 tháng kể từ khi mở nắp'
},
sold: 25200
},
{
id: 2,
name: 'Serum Chống Nắng B.O.M Dưỡng Ẩm Water Glow Sun Serum SPF50+PA++++ 50g',
brand: 'B.O.M',
category: 'cham-soc-da',
price: 438000,
oldPrice: 548000,
discount: '20%',
image: 'https://cdn.hstatic.net/products/1000006063/bt_770a3fcae16d4350ad40ad252a1805fb_1024x1024.jpg',
images: [
'https://cdn.hstatic.net/products/1000006063/bt_770a3fcae16d4350ad40ad252a1805fb_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/download_761a7597092b4c799c8d06e2f284d44c_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/h9_f28910f385f74ac697b04ac151da657b_1024x1024.jpg'
],
description: 'Serum Chống Nắng Dưỡng Ẩm B.O.M Water Glow Sun Serum là tinh chất chống nắng thuộc thương hiệu B.O.M. Sản phẩm giúp bảo vệ da phổ rộng trước tia UVA và UVB cùng khả năng cấp ẩm vượt trội. Công thức sở hữu "SOOTHING COOLER" với các thành phần giúp hạn chế tác động do nhiệt. Đồng thời chứa 89% thành phần dưỡng da như 10 loại HA, Panthenol, chiết xuất rau má, giúp nuôi dưỡng da khỏe hơn, tươi sáng, vừa bảo vệ vừa duy trì vẻ rạng rỡ mỗi ngày.',
details: 'Serum Chống Nắng Dưỡng Ẩm B.O.M Water Glow Sun Serum là tinh chất chống nắng thuộc thương hiệu B.O.M. Sản phẩm giúp bảo vệ da phổ rộng trước tia UVA và UVB cùng khả năng cấp ẩm vượt trội. Công thức sở hữu "SOOTHING COOLER" với các thành phần giúp hạn chế tác động do nhiệt. Đồng thời chứa 89% thành phần dưỡng da như 10 loại HA, Panthenol, chiết xuất rau má, giúp nuôi dưỡng da khỏe hơn, tươi sáng, vừa bảo vệ vừa duy trì vẻ rạng rỡ mỗi ngày.',
specs: {
'Tên sản phẩm': 'Serum Chống Nắng Dưỡng Ẩm B.O.M Water Glow Sun Serum SPF50+PA++++',
'Dung tích': '50g',
'Thương hiệu': 'B.O.M (Hàn Quốc)',
'Nơi sản xuất': 'Hàn Quốc',
'Hạn sử dụng': '36 tháng kể từ ngày sản xuất - 12 tháng kể từ ngày mở nắp',
'Chỉ số chống nắng': 'SPF50+PA++++',
'Đối tượng': 'Mọi loại da'
},
sold: 1500
},
{
id: 3,
name: 'Kem Chống Nắng La Roche-Posay Dạng Sữa, Bảo Vệ Da Khỏi UVA Dài, Ngăn Ngừa Thâm Nám Anthelios UVMune 400 Invisible Fluid SPF50+ 50ml',
brand: 'La Roche-Posay',
category: 'cham-soc-da',
price: 449000,
oldPrice: 640000,
discount: '30%',
image: 'https://product.hstatic.net/1000006063/product/bth_b1850e1e326b4a60ab803afca16b55af_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/bth_b1850e1e326b4a60ab803afca16b55af_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/22_2d9c2cc106af4ff5a8b76a5eabf5a099_1024x1024.png',
'https://product.hstatic.net/1000006063/product/download__9__copy_0db1ec89680a4115ab3a2719df116552_1024x1024.jpg'
],
description: 'Kem Chống Nắng Dạng Sữa, Bảo Vệ Da Khỏi UVA Dài, Ngăn Ngừa Thâm Nám La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ là dòng sản phẩm kem chống nắng có khả năng chống nắng phổ rộng, bảo vệ da toàn diện trước tác hại từ tia UVA/UVB thuộc thương hiệu La Roche-Posay. Chất kem dạng sữa có khả năng kháng trôi tối đa với kết cấu lỏng nhẹ, thẩm thấu nhanh, không nhờn rít, không để lại vệt trắng da. Sản phẩm an toàn với mọi loại da, đặc biệt được chuyên gia khuyên dùng cho da nhạy cảm với ánh nắng do cơ địa hoặc tác nhân bên ngoài.',
details: 'Kem Chống Nắng Dạng Sữa, Bảo Vệ Da Khỏi UVA Dài, Ngăn Ngừa Thâm Nám La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+ là dòng sản phẩm kem chống nắng có khả năng chống nắng phổ rộng, bảo vệ da toàn diện trước tác hại từ tia UVA/UVB thuộc thương hiệu La Roche-Posay. Chất kem dạng sữa có khả năng kháng trôi tối đa với kết cấu lỏng nhẹ, thẩm thấu nhanh, không nhờn rít, không để lại vệt trắng da. Sản phẩm an toàn với mọi loại da, đặc biệt được chuyên gia khuyên dùng cho da nhạy cảm với ánh nắng do cơ địa hoặc tác nhân bên ngoài.',
specs: {
'Tên sản phẩm': 'La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+',
'Dung tích': '50ml',
'Thương hiệu': 'La Roche-Posay (Pháp)',
'Nơi sản xuất': 'Pháp',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Chỉ số chống nắng': 'SPF50+',
'Đối tượng': 'Mọi loại da, đặc biệt da nhạy cảm'
},
},
{
id: 4,
name: 'Kem Chống Nắng CLINICOS Truth Sunscreen SPF 50+ PA++++',
brand: 'CLINICOS',
category: 'cham-soc-da',
price: 129000,
oldPrice: 219000,
discount: '41%',
image: 'https://cdn.hstatic.net/products/1000006063/clinicos_1_01852f0e66eb4f66a1868e5d5c336d03_1024x1024.jpg',
images: [
'https://cdn.hstatic.net/products/1000006063/clinicos_1_01852f0e66eb4f66a1868e5d5c336d03_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/download__9__af2f0acce36047ca8221217379bc5092_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/download__11__31e86468b1e6423587aaae76e74ab00d_1024x1024.jpg'
],
description: 'Kem Chống Nắng CLINICOS Truth Sunscreen SPF 50+ PA++++ là kem chống nắng thuộc thương hiệu CLINICOS. Sự kết hợp của Niacinamide, chiết xuất rễ cam thảo và Vitamin E giúp củng cố hàng rào bảo vệ da trước các tác nhân bụi bẩn và tác hại môi trường, mà còn hỗ trợ ngăn ngừa sạm nám, làm dịu vùng da tổn thương, chống oxi hóa, đồng thời dưỡng ẩm và nuôi dưỡng làn da sáng khỏe. Với chỉ số chống nắng SPF50 PA++++.',
details: 'Kem Chống Nắng CLINICOS Truth Sunscreen SPF 50+ PA++++ là kem chống nắng thuộc thương hiệu CLINICOS. Sự kết hợp của Niacinamide, chiết xuất rễ cam thảo và Vitamin E giúp củng cố hàng rào bảo vệ da trước các tác nhân bụi bẩn và tác hại môi trường, mà còn hỗ trợ ngăn ngừa sạm nám, làm dịu vùng da tổn thương, chống oxi hóa, đồng thời dưỡng ẩm và nuôi dưỡng làn da sáng khỏe. Với chỉ số chống nắng SPF50 PA++++. Có 2 loại: Kem Chống Nắng Cho Da Nhạy Cảm và Kem Chống Nắng Nâng Tông Tự Nhiên.',
specs: {
'Tên sản phẩm': 'CLINICOS Truth Sunscreen SPF 50+ PA++++',
'Dung tích': '10ml, 50ml',
'Thương hiệu': 'CLINICOS (Việt Nam)',
'Nơi sản xuất': 'Việt Nam',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Chỉ số chống nắng': 'SPF50+ PA++++',
'Đối tượng': 'Mọi loại da, đặc biệt da nhạy cảm'
},
sold: 33
},
{
id: 5,
name: 'Kem Chống Nắng Caryophy Nâng Tông Smart Sunscreen Tone Up SPF50+/PA+++ 50ml',
brand: 'CARYOPHY',
category: 'cham-soc-da',
price: 310000,
oldPrice: 360000,
discount: '14%',
image: 'https://product.hstatic.net/1000006063/product/a5dee1093d94a01c9bed0bd7d75_72f7f1f42a4a4a3c9f89d24674a0cc6f_1024x1024_884db8ac03f643708b5baed015ec0eb7_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/a5dee1093d94a01c9bed0bd7d75_72f7f1f42a4a4a3c9f89d24674a0cc6f_1024x1024_884db8ac03f643708b5baed015ec0eb7_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/1_8ad78ee4ef8d47c0a72c3d6dbfa1741d_1024x1024.png',
'https://product.hstatic.net/1000006063/product/446_f1efbaa6e8cb4adea046ed01153f_bbb13221bad44567a371ea3d014a8d6d_1024x1024.jpg'
],
description: 'Kem Chống Nắng Caryophy Nâng Tông Smart Sunscreen Tone Up SPF50+/PA+++ là kem chống nắng thuộc thương hiệu Caryophy. Sản phẩm với thành phần chiết xuất từ thiên nhiên như củ dền đỏ, rau má, rau sam, nho, các Vitamin, mang lại tác dụng 3in1 bảo vệ làn da. Có khả năng bảo vệ da hơn 98% trước tia UV, nâng tone da tự nhiên.',
details: 'Kem Chống Nắng Caryophy Nâng Tông Smart Sunscreen Tone Up SPF50+/PA+++ là kem chống nắng thuộc thương hiệu Caryophy. Sản phẩm với thành phần chiết xuất từ thiên nhiên như củ dền đỏ, rau má, rau sam, nho, các Vitamin, mang lại tác dụng 3in1 bảo vệ làn da. Có khả năng bảo vệ da hơn 98% trước tia UV, nâng tone da tự nhiên.',
specs: {
'Tên sản phẩm': 'Caryophy Smart Sunscreen Tone Up SPF50+/PA+++',
'Dung tích': '50ml',
'Thương hiệu': 'Caryophy (Hàn Quốc)',
'Nơi sản xuất': 'Hàn Quốc',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Chỉ số chống nắng': 'SPF50+/PA+++',
'Đối tượng': 'Mọi loại da, đặc biệt da xỉn màu'
},
sold: 2600
},
{
id: 8,
name: 'Kem Chống Nắng Nâng Tone, Kiềm Dầu, Dưỡng Ẩm Make P:rem UV Defense Me Sun Cream SPF50+/PA++++ 50ml',
brand: 'Make P:rem',
category: 'cham-soc-da',
price: 309000,
oldPrice: 450000,
discount: '31%',
image: 'https://product.hstatic.net/1000006063/product/bt_watery_e83562e4e591408c9801d18259120ea1_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/bt_watery_e83562e4e591408c9801d18259120ea1_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/make_prem_93c720d528a04423af56f1bc861aada8_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/download_c05eacf6bae846e28efda26483aa8ea3_1024x1024.jpg'
],
description: 'Kem Chống Nắng Nâng Tone, Kiềm Dầu, Dưỡng Ẩm Make P:rem UV Defense Me Sun Cream SPF50+/PA++++ là kem chống nắng thuộc thương hiệu Make P:rem đến từ Hàn Quốc. Với chỉ số chống nắng cao SPF50+/PA++++ giúp bảo vệ da trước ánh nắng mặt trời. Kem chống nắng với nhiều dòng phù hợp cho từng loại da khác nhau, cùng thành phần lành tính giúp chăm sóc làn da mềm mịn.',
details: 'Kem Chống Nắng Nâng Tone, Kiềm Dầu, Dưỡng Ẩm Make P:rem UV Defense Me Sun Cream SPF50+/PA++++ hiện đã có mặt tại Thế Giới Skinfood với 4 loại: Kem Chống Nắng Vật Lý Nâng Tone Hồng Rạng Rỡ Make P:rem UV Defense Me Soothing pink Tone Up Sun Cream SPF50+/PA++++ 50ml (Màu hồng), Kem Chống Nắng Vật Lý Cho Da Nhạy Cảm Make P:rem UV Defense Me Calming Sun Cream SPF50+/PA++++ 50ml (màu trắng nắp xanh dương), Kem Chống Nắng Hóa Học Dưỡng Ẩm, Căng Bóng Da Make P:rem UV Defense Me Watery Capsule Sun Cream SPF50+/PA++++ 50ml (Màu xanh dương), Kem Chống Nắng Vật Lý Kiềm Dầu, Nâng Tone Trắng Sáng Make P:rem UV Defense Me No Sebum Sun Cream SPF50+/PA++++ 50ml (màu xanh lá).',
specs: {
'Tên sản phẩm': 'Make P:rem UV Defense Me Sun Cream SPF50+/PA++++',
'Kết cấu': 'Dạng kem',
'Dung tích': '50ml',
'Thương hiệu': 'Make P:rem (Hàn Quốc)',
'Nơi sản xuất': 'Hàn Quốc',
'Hạn sử dụng': '36 tháng kể từ ngày sản xuất in trên bao bì'
},
sold: 351
},
{
id: 9,
name: 'Kem Chống Nắng Acnes Hỗ Trợ Giảm Mụn Blemish Control Sunscreen 50g',
brand: 'Acnes',
category: 'cham-soc-da',
price: 148000,
oldPrice: 158000,
discount: '6%',
image: 'https://product.hstatic.net/1000006063/product/vn-11134201-23030-scu1mi2xkpov69_ea5a65254a374a0a89a267fd4eed714f_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/vn-11134201-23030-scu1mi2xkpov69_ea5a65254a374a0a89a267fd4eed714f_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/3_b43b4db3418c4e519b5435a275ea48eb_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/vn-11134201-23030-8zz36v5xkpov52_7af8369aa9ca402b889e86cb79d34974_1024x1024.jpg'
],
description: 'Kem Chống Nắng Acnes Hỗ Trợ Giảm Mụn Blemish Control Sunscreen 50g là dòng kem chống nắng mới đến từ thương hiệu mỹ phẩm Acnes. Có chỉ số chống nắng SPF50+ PA++++ với màng lọc tia cực tím và phản xạ đa chiều giúp bảo vệ da. Cùng với thành phần tràm trà, hoạt chất Terpenoids giúp hỗ trợ giảm mụn và cải thiện tình trạng mụn.',
details: 'Kem Chống Nắng Acnes Hỗ Trợ Giảm Mụn Blemish Control Sunscreen 50g là dòng kem chống nắng mới đến từ thương hiệu mỹ phẩm Acnes. Có chỉ số chống nắng SPF50+ PA++++ với màng lọc tia cực tím và phản xạ đa chiều giúp bảo vệ da. Cùng với thành phần tràm trà, hoạt chất Terpenoids giúp hỗ trợ giảm mụn và cải thiện tình trạng mụn. Những thành phần Duo Vitamin B3 (Niacinamide) & B5 (Panthenol), Dipotassium Glycyrrhizate hỗ trợ làm dịu vùng da mụn, duy trì độ ẩm, cải thiện tình trạng mụn. Có kết cấu dạng sữa, nhanh thẩm thấu vào da, không gây tình trạng bóng nhờn trên da. Sản phẩm lành tính cho da, không chứa Cồn, Paraben, dầu thoáng, hương liệu.',
specs: {
'Tên sản phẩm': 'Acnes Blemish Control Sunscreen',
'Dung tích': '50g',
'Thương hiệu': 'Acnes (Nhật Bản)',
'Nơi sản xuất': 'Việt Nam',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Chỉ số chống nắng': 'SPF50+ PA++++',
'Đối tượng': 'Da dầu mụn, da nhạy cảm'
},
sold: 24
},
{
id: 10,
name: 'Gel Chống Nắng Anessa Dưỡng Ẩm, Bảo Vệ Da Perfect UV Sunscreen Skincare Gel SPF50+/PA++++ 90g',
brand: 'Anessa',
category: 'cham-soc-da',
price: 488000,
oldPrice: 575000,
discount: '15%',
image: 'https://product.hstatic.net/1000006063/product/8_38fdbb4cd52541b58537b5136a144bea_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/8_38fdbb4cd52541b58537b5136a144bea_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/anessa_perfect_uv_sunscreen_skincare_gel__8278941c81214a26bbd0e44cbb0a002e_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/download__2__2ac2e645c84f452ca877838118652902_1024x1024.jpeg'
],
description: 'Gel Chống Nắng Anessa Dưỡng Ẩm, Bảo Vệ Da Perfect UV Sunscreen Skincare Gel SPF50+/PA++++ là gel chống nắng chống trôi, dưỡng da với công nghệ Auto Veil và Aqua Booster giúp bảo vệ da trước các tác động, ngăn mất nước 16h và chống bụi PM2.5.',
details: 'Gel Chống Nắng Anessa Dưỡng Ẩm, Bảo Vệ Da Perfect UV Sunscreen Skincare Gel SPF50+/PA++++ là gel chống nắng chống trôi, dưỡng da với công nghệ Auto Veil và Aqua Booster giúp bảo vệ da trước các tác động, ngăn mất nước 16h và chống bụi PM2.5. Bao bì giấy thân thiện môi trường, kết cấu gel ẩm mượt, mát mịn, có thể làm sạch với xà phòng.',
specs: {
'Tên sản phẩm': 'Anessa Perfect UV Sunscreen Skincare Gel',
'Dung tích': '90g',
'Thương hiệu': 'Anessa (Nhật Bản)',
'Nơi sản xuất': 'Nhật Bản',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Chỉ số chống nắng': 'SPF50+/PA++++',
'Đối tượng': 'Da thiên khô'
},
sold: 517
},
{
id: 11,
name: 'Miếng Pad Dưỡng Ẩm, Làm Dịu Da Emmié by HappySkin Semi-Gel Mask Pad 120ml (60 miếng)',
brand: 'Emmié by HappySkin',
category: 'cham-soc-da',
price: 315000,
oldPrice: 450000,
discount: '30%',
image: 'https://cdn.hstatic.net/products/1000006063/emmie_copy_28ed3a4f9ae3421db56ff99742a1599f_1024x1024.jpg',
images: [
'https://cdn.hstatic.net/products/1000006063/emmie_copy_28ed3a4f9ae3421db56ff99742a1599f_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/8_01e92ca367694f6bb15915fd83145447_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/1_b1358f2c00ac452bb870597c0352a8a3_1024x1024.jpg'
],
description: 'Toner Pad Emmié by HappySkin Dưỡng Ẩm, Làm Dịu Da, Hỗ Trợ Làm Sáng Da Semi-Gel Mask Pad là miếng pad dưỡng da đa năng giúp cấp ẩm tức thì, làm dịu vùng da nhạy cảm và hỗ trợ làm sáng da hiệu quả. Với kết cấu Semi-gel độc đáo, sản phẩm ôm sát vào da như một miếng mặt nạ, giúp dưỡng chất thẩm thấu sâu hơn.',
details: 'Toner Pad Emmié by HappySkin Dưỡng Ẩm, Làm Dịu Da, Hỗ Trợ Làm Sáng Da Semi-Gel Mask Pad là miếng pad dưỡng da đa năng giúp cấp ẩm tức thì, làm dịu vùng da nhạy cảm và hỗ trợ làm sáng da hiệu quả. Với kết cấu Semi-gel độc đáo, sản phẩm ôm sát vào da như một miếng mặt nạ, giúp dưỡng chất thẩm thấu sâu hơn. Thành phần chứa phức hợp dưỡng ẩm sâu và các chiết xuất thiên nhiên lành tính, an toàn cho mọi loại da, kể cả da nhạy cảm nhất.',
specs: {
'Tên sản phẩm': 'Emmié by HappySkin Semi-Gel Mask Pad',
'Dung tích': '120ml (60 miếng)',
'Thương hiệu': 'Emmié by HappySkin (Việt Nam)',
'Nơi sản xuất': 'Việt Nam',
'Hạn sử dụng': '36 tháng kể từ ngày sản xuất',
'Thành phần chính': 'Hyaluronic Acid, Panthenol, Niacinamide',
'Đối tượng': 'Mọi loại da'
},
sold: 850
},
{
id: 12,
name: 'Nước Dưỡng Tóc Tinh Dầu Bưởi Cocoon Pomelo Hair Tonic 140ml',
brand: 'Cocoon',
category: 'cham-soc-toc',
price: 158000,
oldPrice: 185000,
discount: '15%',
image: 'https://product.hstatic.net/1000006063/product/dai_dien_dce04d99812b47ada407478149e79841_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/dai_dien_dce04d99812b47ada407478149e79841_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/vn-11134207-7qukw-lgghts6etzze18_4e025266eb46464381ed1214c2a30f95.jfif',
'https://product.hstatic.net/1000006063/product/vn-11134207-7r98o-lwqnel1sckih70_594a1032dac54224bc4c246808d12d51_1024x1024.jpg'
],
description: 'Nước dưỡng tóc tinh dầu bưởi Cocoon giúp giảm rụng tóc, kích thích tóc mọc nhanh và nuôi dưỡng tóc chắc khỏe từ gốc đến ngọn.',
details: 'Nước dưỡng tóc tinh dầu bưởi Cocoon Pomelo Hair Tonic là sản phẩm chăm sóc tóc từ thương hiệu mỹ phẩm thuần chay Cocoon của Việt Nam. Với sự kết hợp giữa tinh dầu bưởi nguyên chất, Xylishine, Baicapil và Vitamin B5, sản phẩm mang đến giải pháp hiệu quả cho tình trạng tóc mỏng, dễ rụng.',
specs: {
'Tên sản phẩm': 'Cocoon Pomelo Hair Tonic',
'Dung tích': '140ml',
'Thương hiệu': 'Cocoon (Việt Nam)',
'Nơi sản xuất': 'Việt Nam',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Đối tượng': 'Mọi loại tóc, đặc biệt là tóc yếu, dễ rụng'
},
sold: 1250
},
{
id: 13,
name: 'Dầu Dưỡng Tóc L\'Oreal Elseve Extraordinary Oil 100ml',
brand: 'L\'Oreal',
category: 'cham-soc-toc',
price: 199000,
oldPrice: 259000,
discount: '23%',
image: 'https://product.hstatic.net/1000006063/product/l_oreal_elseve_extraordinary_oil_serum_100ml_007ce77196394a61be72d344439c24d9_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/l_oreal_elseve_extraordinary_oil_serum_100ml_007ce77196394a61be72d344439c24d9_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/vn-11134207-7qukw-ley5ppsqb3iia0_9300503da8654f0ebaddd51a311ebe45_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/vn-11134207-7qukw-ley5ppspltaiae_24e9445daa844ef189eb09a870b7dfa8_1024x1024.jpg'
],
description: 'Dầu dưỡng tóc L\'Oreal Paris Elseve Extraordinary Oil với chiết xuất từ 6 loại hoa quý giúp nuôi dưỡng tóc mềm mượt, bóng khỏe.',
details: 'Dầu dưỡng tóc L\'Oreal Paris Elseve Extraordinary Oil là sản phẩm dưỡng tóc đa năng, cung cấp dưỡng chất sâu cho tóc khô xơ, hư tổn. Với kết cấu mỏng nhẹ, thấm nhanh, sản phẩm giúp tóc suôn mượt tức thì mà không gây bết dính.',
specs: {
'Tên sản phẩm': 'L\'Oreal Elseve Extraordinary Oil',
'Dung tích': '100ml',
'Thương hiệu': 'L\'Oreal (Pháp)',
'Nơi sản xuất': 'Indonesia',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Đối tượng': 'Tóc khô xơ, hư tổn'
},
sold: 3400
}
,
{
id: 14,
name: 'Xịt Dưỡng Tóc Ha\'sol Hỗ Trợ Mọc Tóc Anagen Active Tonic 100ml',
brand: 'Ha\'sol',
category: 'cham-soc-toc',
price: 455000,
oldPrice: 650000,
discount: '30%',
image: 'https://cdn.hstatic.net/products/1000006063/ha_sol_79609e4f4d934ea8b56988ebf2a4c7f0_1024x1024.jpg',
images: [
'https://cdn.hstatic.net/products/1000006063/ha_sol_79609e4f4d934ea8b56988ebf2a4c7f0_1024x1024.jpg',
'https://cdn.hstatic.net/products/1000006063/download__3__1d2237e1c60a43dfa06ca090bb412b75_1024x1024.jpeg',
'https://cdn.hstatic.net/products/1000006063/download__1__2e1c89d1d4b840a1a8f24778d859d511_1024x1024.jpeg'
],
description: 'Xịt dưỡng tóc Ha\'sol Anagen Active Tonic giúp cải thiện tình trạng rụng tóc, kích thích mọc tóc và nuôi dưỡng da đầu khỏe mạnh.',
details: 'Sản phẩm đến từ thương hiệu Ha\'sol Hàn Quốc, chuyên biệt cho da đầu yếu và tóc dễ rụng. Với chiết xuất từ các loại thảo dược quý hiếm, xịt dưỡng giúp cung cấp dưỡng chất sâu vào nang tóc, giảm nhiệt độ da đầu và tạo môi trường lý tưởng cho tóc phát triển dày mượt.',
specs: {
'Tên sản phẩm': 'Ha\'sol Anagen Active Tonic',
'Dung tích': '100ml',
'Thương hiệu': 'Ha\'sol (Hàn Quốc)',
'Nơi sản xuất': 'Hàn Quốc',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Đối tượng': 'Người có tóc thưa, mỏng, rụng tóc nhiều'
},
sold: 520
},
{
id: 15,
name: 'Kem Ủ Tóc Dove Cao Cấp Phục Hồi Hư Tổn 180ml',
brand: 'Dove',
category: 'cham-soc-toc',
price: 159000,
oldPrice: 215000,
discount: '26%',
image: 'https://product.hstatic.net/1000006063/product/unilever_e_copy_9016c3502bd9443ab94af880d9e6c06f_1024x1024.jpg',
images: [
'https://product.hstatic.net/1000006063/product/unilever_e_copy_9016c3502bd9443ab94af880d9e6c06f_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/download_b52c2d8269744f0eaa0006c96887cb42_1024x1024.jpg',
'https://product.hstatic.net/1000006063/product/download__1__16fda4651a804b72b5de58809e7fcfeb_1024x1024.jpg'
],
description: 'Kem ủ tóc Dove cao cấp giúp phục hồi hư tổn nặng, mang lại mái tóc suôn mượt, chắc khỏe ngay từ lần sử dụng đầu tiên.',
details: 'Kem ủ tóc Dove Intensive Repair là giải pháp phục hồi chuyên sâu cho tóc khô xơ và hư tổn do tác động của nhiệt hoặc hóa chất. Công nghệ định vị hư tổn chính xác giúp nuôi dưỡng sợi tóc từ sâu bên trong, ngăn ngừa chẻ ngọn và gãy rụng.',
specs: {
'Tên sản phẩm': 'Dove Intensive Repair Mask',
'Dung tích': '180ml',
'Thương hiệu': 'Dove (Hà Lan)',
'Nơi sản xuất': 'Việt Nam',
'Hạn sử dụng': '3 năm kể từ ngày sản xuất',
'Đối tượng': 'Tóc khô xơ, hư tổn, tóc sau khi làm hóa chất'
},
sold: 1250
},
{
    id: 16,
    name: '[Bản Trung] Sữa Dưỡng Thể Trắng Da Olay Body Cellscience Super Bright Whitening Lotion',
    brand: 'Olay',
    category: 'bodycare',
    price: 359000,
    oldPrice: 420000,
    discount: '15%',
    image: 'https://cdn.hstatic.net/products/1000006063/olay_a6cd68555dec44639f4795f55046ff84_1024x1024.jpg',
    images: [
        'https://cdn.hstatic.net/products/1000006063/olay_a6cd68555dec44639f4795f55046ff84_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/5_ed3b9af90e734016a9a84307aaace089_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/4_ec96bff692734c3ead3aeff263c5e9b7_1024x1024.jpg'
    ],
    description: 'Sữa dưỡng thể Olay chứa Niacinamide và Vitamin C giúp dưỡng trắng da, làm đều màu da.',
    details: 'Sữa Dưỡng Thể Trắng Da Olay Body Cellscience Super Bright Whitening Lotion với hàm lượng Niacinamide tinh khiết cao kết hợp cùng Vitamin C giúp nuôi dưỡng làn da trắng sáng bật tông.',
    specs: {
        'Tên sản phẩm': 'Olay Body Cellscience Super Bright',
        'Dung tích': '210ml / 250ml',
        'Thương hiệu': 'Olay',
        'Nơi sản xuất': 'Trung Quốc'
    },
    sold: 15600
},
{
    id: 17,
    name: 'Sữa Dưỡng Thể DrCeutics Niacinamide 10% + Arbutin 2% Body Lotion Dưỡng Trắng, Phục Hồi Da',
    brand: 'DrCeutics',
    category: 'bodycare',
    price: 216000,
    oldPrice: 280000,
    discount: '23%',
    image: 'https://product.hstatic.net/1000006063/product/200g_3daee16554c6439f92568530e2ff9638_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/200g_3daee16554c6439f92568530e2ff9638_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/5_a714da433e814e03b5abb1ec6fd55327_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/3_5318b018ef6a40fbb3c143722314fba0_1024x1024.jpg'
    ],
    description: 'Sữa dưỡng thể chứa 10% Niacinamide và 2% Arbutin giúp cải thiện sắc tố da cơ thể hiệu quả.',
    details: 'Sữa Dưỡng Thể DrCeutics Niacinamide 10% + Arbutin 2% là giải pháp cho làn da cơ thể tối màu, thâm sạm với nồng độ hoạt chất cao.',
    specs: {
        'Tên sản phẩm': 'DrCeutics Niacinamide 10% + Arbutin 2%',
        'Dung tích': '200g / 500g',
        'Thương hiệu': 'DrCeutics (Việt Nam)',
        'Nơi sản xuất': 'Việt Nam'
    },
    sold: 8900
},
{
    id: 18,
    name: 'Son Tint Merzy Mịn Lì, Bền Màu, Fit Môi Tự Nhiên Water Fit Blur Tint',
    brand: 'Merzy',
    category: 'trang-diem-son-moi',
    price: 159000,
    oldPrice: 250000,
    discount: '36%',
    image: 'https://cdn.hstatic.net/products/1000006063/thum__1__b21510ab0920480da2f579a24031a569_1024x1024.jpg',
    images: [
        'https://cdn.hstatic.net/products/1000006063/thum__1__b21510ab0920480da2f579a24031a569_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/h1_a285e202ba1140ea829be96edd71dbc1_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/image_d6a50ee03503429f8b4b16107edd1c92_1024x1024.png'
    ],
    description: 'Chất son mịn lì, nhẹ môi, bám màu tốt và che phủ khuyết điểm môi hoàn hảo.',
    details: 'Son Tint Merzy Water Fit Blur Tint mang đến kết cấu son kem lì mướt mịn như nhung. Công nghệ Blur Fit giúp son bám chặt vào môi nhưng vẫn giữ được sự mềm mại, không gây khô hay lộ vân môi.',
    specs: {
        'Tên sản phẩm': 'Merzy Water Fit Blur Tint',
        'Chất son': 'Tint lì (Blur Tint)',
        'Dung tích': '4g',
        'Thương hiệu': 'Merzy',
        'Nơi sản xuất': 'Hàn Quốc'
    },
    sold: 12400
},
{
    id: 19,
    name: 'Son Tint Bền Màu Fwee Rose Obsession Stay Fit Tint',
    brand: 'Fwee',
    category: 'trang-diem-son-moi',
    price: 289000,
    oldPrice: 350000,
    discount: '17%',
    image: 'https://cdn.hstatic.net/products/1000006063/fwee_2819eb38e14d48f680a973f8b7e74d9e_1024x1024.jpg',
    images: [
        'https://cdn.hstatic.net/products/1000006063/fwee_2819eb38e14d48f680a973f8b7e74d9e_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/download_d152b537d81f40cf999ca07a7a3d8af3_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/download__1__e660cea62c1c4fe296d1b677e3d241fe_1024x1024.jpg'
    ],
    description: 'Dòng son lấy cảm hứng từ những đóa hồng kiêu sa, chất son Stay Fit bám màu cả ngày dài.',
    details: 'Fwee Rose Obsession Stay Fit Tint là sự kết hợp hoàn hảo giữa sắc màu lãng mạn và độ bền màu ấn tượng. Son lên môi chuẩn sắc ngay từ lần quẹt đầu tiên, để lại lớp finish mịn màng như cánh hoa hồng.',
    specs: {
        'Tên sản phẩm': 'Fwee Rose Obsession Stay Fit Tint',
        'Dung tích': '4.5g',
        'Thương hiệu': 'Fwee',
        'Nơi sản xuất': 'Hàn Quốc'
    },
    sold: 3800
},
{
    id: 20,
    name: 'Son Tint Bóng B.O.M Lip Flash Tint 3g',
    brand: 'B.O.M',
    category: 'trang-diem-son-moi',
    price: 159000,
    oldPrice: 220000,
    discount: '28%',
    image: 'https://cdn.hstatic.net/products/1000006063/bom_f36662e5f6da4e8d91acaed985fcd6f3_1024x1024.jpg',
    images: [
        'https://cdn.hstatic.net/products/1000006063/bom_f36662e5f6da4e8d91acaed985fcd6f3_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/h3_f73a87790d784b828d1d07ebcac1639c_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/h8_83b92fc3b9d54320baa5ce8711981d9e_1024x1024.jpg'
    ],
    description: 'Son tint bóng với hiệu ứng bắt sáng cực đỉnh, cho đôi môi căng mọng như pha lê.',
    details: 'B.O.M Lip Flash Tint sở hữu công thức mỏng nhẹ, mang lại lớp bóng gương rạng rỡ mà không gây nặng môi hay bết dính. Sắc son lên chuẩn chỉ sau một lần quẹt và giữ màu bền bỉ.',
    specs: {
        'Tên sản phẩm': 'B.O.M Lip Flash Tint',
        'Dung tích': '3g',
        'Thương hiệu': 'B.O.M',
        'Nơi sản xuất': 'Hàn Quốc'
    },
    sold: 5200
},
{
    id: 21,
    name: 'Son Kem Bùn Judydoll Lì Mịn, Lâu Trôi, Bền Màu Matte Lip Mud',
    brand: 'Judydoll',
    category: 'trang-diem-son-moi',
    price: 139000,
    oldPrice: 195000,
    discount: '29%',
    image: 'https://cdn.hstatic.net/products/1000006063/judydoll_copy_e3bcc32282d746a48f2184206eca8d7e_1024x1024.jpg',
    images: [
        'https://cdn.hstatic.net/products/1000006063/judydoll_copy_e3bcc32282d746a48f2184206eca8d7e_1024x1024.jpg',
        'https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-lpvk332qybsn23',
        'https://cdn.hstatic.net/products/1000006063/39_3bc9c6a4f12a4806b7b3603bd9b2cb02_1024x1024.png'
    ],
    description: 'Kết cấu dạng bùn mềm mịn, tạo hiệu ứng mờ lì đỉnh cao và che phủ vân môi hoàn hảo.',
    details: 'Son kem bùn Judydoll Matte Lip Mud mang đến trải nghiệm trang điểm môi phong cách Trung Hoa đang cực hot. Chất son siêu mịn, dễ tán, có thể dùng làm cả phấn má.',
    specs: {
        'Tên sản phẩm': 'Judydoll Matte Lip Mud',
        'Thương hiệu': 'Judydoll',
        'Nơi sản xuất': 'Trung Quốc'
    },
    sold: 18900
},
{
    id: 22,
    name: 'Son Tint Gương Bóng Colorkey Bền Màu, Căng Bóng Airy Lip Mirror Series',
    brand: 'Colorkey',
    category: 'trang-diem-son-moi',
    price: 165000,
    oldPrice: 210000,
    discount: '21%',
    image: 'https://cdn.hstatic.net/products/1000006063/colorkey_78ec67e8ef2d4ddebde815145977f9e3_1024x1024.jpg',
    images: [
        'https://cdn.hstatic.net/products/1000006063/colorkey_78ec67e8ef2d4ddebde815145977f9e3_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/cn-11134207-7qukw-liwzga4etilyba_80b821b5d6264f9e9eb1596557bd99bd_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/38_57a73af68eec43f3854538a85565afce_1024x1024.png'
    ],
    description: 'Lớp bóng gương trong suốt cùng màng phim giữ màu giúp đôi môi luôn rạng rỡ.',
    details: 'Colorkey Airy Lip Mirror Series sử dụng công nghệ màng phim đặc biệt, giúp lớp bóng tách biệt với lớp màu, giữ cho màu son không bị trôi khi ăn uống nhẹ.',
    specs: {
        'Tên sản phẩm': 'Colorkey Airy Lip Mirror Series',
        'Thương hiệu': 'Colorkey',
        'Nơi sản xuất': 'Trung Quốc'
    },
    sold: 32400
},
{
    id: 23,
    name: 'Mặt Nạ Dưỡng Ẩm Chiết Xuất Mật Ong Và Sữa B.O.M Honey & Milk Mask 25ml',
    brand: 'B.O.M',
    category: 'cham-soc-da',
    price: 19000,
    oldPrice: 30000,
    discount: '37%',
    image: 'https://cdn.hstatic.net/products/1000006063/29_626508f41adf4988875fe8d5ca022e8c_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/29_626508f41adf4988875fe8d5ca022e8c_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/untitled-1_87d859435cbc447d864323b7b8fe88f6_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/sg-11134201-22100-5z94njq6h2ivff_2c98017ae89d402fbe9b3d92c296df84_1024x1024.jpg'
    ],
    description: 'Mặt nạ giấy dưỡng ẩm B.O.M Honey & Milk Mask giàu dưỡng chất từ mật ong và protein sữa giúp phục hồi làn da khô ráp, mang lại vẻ rạng rỡ, căng mướt.',
    details: 'Mặt nạ giấy dưỡng ẩm B.O.M Honey & Milk Mask là giải pháp cấp ẩm cấp tốc cho làn da mệt mỏi. Sự kết hợp giữa mật ong kháng khuẩn và sữa dưỡng sáng giúp da mịn màng, giảm kích ứng.',
    specs: {
        'Tên sản phẩm': 'B.O.M Honey & Milk Mask',
        'Dung tích': '25ml',
        'Thương hiệu': 'B.O.M (Hàn Quốc)',
        'Nơi sản xuất': 'Hàn Quốc',
        'Đối tượng': 'Mọi loại da'
    },
    sold: 1200
},
{
    id: 27,
    name: 'Phấn Nước Che Phủ Hoàn Hảo Merzy The First Cushion Cover 13g',
    brand: 'Merzy',
    category: 'trang-diem-nen',
    price: 249000,
    oldPrice: 380000,
    discount: '34%',
    image: 'https://cdn.hstatic.net/products/1000006063/19_7c4142f2aca74de8b88d7f928d9a595b_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/19_7c4142f2aca74de8b88d7f928d9a595b_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/merzy_the_first_cushion_cover_daeb0afec61a4b84b0a5340b336ecccd_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/mc7_b0d5edb6a9d7461c99c3e88933c7535d_1024x1024.jpg'
    ],
    description: 'Phấn nước Merzy The First Cushion Cover mang lại lớp nền hoàn hảo với độ che phủ cao, kiềm dầu tốt và bền màu suốt ngày dài.',
    details: 'Merzy The First Cushion Cover sở hữu kết cấu mỏng nhẹ nhưng có khả năng che phủ khuyết điểm vượt trội. Công nghệ giữ màu tiên tiến giúp lớp nền không bị xuống tông, kiềm dầu tốt và mang lại cảm giác thoải mái cho da.',
    specs: { 'Khối lượng': '13g', 'Thương hiệu': 'Merzy (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 450
},
{
    id: 28,
    name: 'Nước Tẩy Trang Mắt Môi Chiết Xuất Quả Mọng Merzy Good Berry Lip & Eye Remover 210ml',
    brand: 'Merzy',
    category: 'trang-diem',
    price: 149000,
    oldPrice: 245000,
    discount: '39%',
    image: 'https://cdn.hstatic.net/products/1000006063/38_05678d3f5327484da1f203dd87ac22cc_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/38_05678d3f5327484da1f203dd87ac22cc_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/merzy_good_berry_lip_eye_remover_210ml_4b94c3fb62954bfb9a91c1cb959d4526_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/267_e3f6b994b4284f0e826c76abfd62d547_1024x1024.jpg'
    ],
    description: 'Nước tẩy trang mắt môi chuyên dụng Merzy Good Berry Lip & Eye Remover giúp loại bỏ sạch lớp trang điểm chống nước bền màu nhất một cách dịu nhẹ.',
    details: 'Với công thức hai lớp (nước và dầu) kết hợp cùng chiết xuất từ các loại quả mọng (berry), sản phẩm không chỉ làm sạch hiệu quả mà còn nuôi dưỡng vùng da mắt, môi nhạy cảm, mang lại cảm giác tươi mát và ẩm mượt sau khi sử dụng.',
    specs: { 'Dung tích': '210ml', 'Thương hiệu': 'Merzy (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 320
},
{
    id: 29,
    name: 'Dầu Tẩy Trang Sạch Sâu, Dịu Nhẹ Merzy One Shot Melting Cleansing Oil 300ml',
    brand: 'Merzy',
    category: 'skincare',
    price: 239000,
    oldPrice: 380000,
    discount: '37%',
    image: 'https://cdn.hstatic.net/products/1000006063/33_92355ebb29214721b9ed0993ac8c0efc_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/33_92355ebb29214721b9ed0993ac8c0efc_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/dau_tay_trang_k_co_tp_1f95cca20a374e2d90710ccea85a4096_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/ba203536ac1efda35e5d00bd84ed03d6_70d581092fc54e07b6d16389bba4bff6_1024x1024.jpg'
    ],
    description: 'Dầu tẩy trang sạch sâu Merzy One Shot Melting Cleansing Oil giúp loại bỏ hoàn toàn bụi bẩn và lớp trang điểm mà vẫn giữ được độ ẩm tự nhiên cho da.',
    details: 'Với công nghệ One Shot, dầu tẩy trang Merzy dễ dàng hòa tan các loại mỹ phẩm chống nước. Thành phần chiết xuất từ thiên nhiên giúp nhũ hóa nhanh, sạch sâu lỗ chân lông và mang lại cảm giác tươi mới sau khi sử dụng.',
    specs: { 'Dung tích': '300ml', 'Thương hiệu': 'Merzy (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 560
},
{
    id: 30,
    name: 'Phấn Nước Trang Điểm Che Phủ Hoàn Hảo B.O.M Cover Flex Cushion SPF50+ PA+++ 15g',
    brand: 'B.O.M',
    category: 'trang-diem-nen',
    price: 329000,
    oldPrice: 520000,
    discount: '37%',
    image: 'https://product.hstatic.net/1000006063/product/2_edb54b7aaec546b1b3c19ecf91f53810_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/2_edb54b7aaec546b1b3c19ecf91f53810_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/31_ebfea447934e4a3facbfa16ac648cba2_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/37_2e824118ff174d7d801f848dc4717247_1024x1024.jpg'
    ],
    description: 'Phấn nước B.O.M Cover Flex Cushion mang lại lớp nền mỏng nhẹ tự nhiên nhưng vẫn có độ che phủ tuyệt vời, kiềm dầu tốt và bền màu suốt ngày dài.',
    details: 'B.O.M Cover Flex Cushion sở hữu công nghệ Flex-Cover giúp lớp nền bám chặt vào da, che phủ các khuyết điểm một cách tự nhiên mà không gây cảm giác dày nặng. Sản phẩm còn chứa các thành phần dưỡng da giúp duy trì độ ẩm và bảo vệ da trước tác hại của tia UV.',
    specs: { 'Khối lượng': '15g', 'Thương hiệu': 'B.O.M (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 210
},
{
    id: 31,
    name: 'Kem Nền B.O.M Che Phủ Tốt, Mỏng Mịn, Lâu Trôi Cover Flex Skin Fit Foundation 30ml',
    brand: 'B.O.M',
    category: 'trang-diem-nen',
    price: 339000,
    oldPrice: 480000,
    discount: '29%',
    image: 'https://product.hstatic.net/1000006063/product/b.o.m_cover_flex_skin_fit_foundation_30ml_ddede178af2949549402c7996965cf59_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/b.o.m_cover_flex_skin_fit_foundation_30ml_ddede178af2949549402c7996965cf59_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/bt_21_3c16cf293d134e248ea410e3cb4b2073_510a4e41228c479d8e90366dd957e0f0_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/b.o.m_cover_flex_skin_fit_foundation_30ml_ddede178af2949549402c7996965cf59_1024x1024.jpg'
    ],
    description: 'Kem nền B.O.M Cover Flex Skin Fit Foundation với công nghệ Flex-fit giúp lớp nền mỏng mịn, bám chặt vào da và che phủ hoàn hảo các khuyết điểm.',
    details: 'Sản phẩm mang lại lớp finish tự nhiên, mỏng nhẹ như làn da thật nhưng vẫn có khả năng che phủ tốt các vết thâm, lỗ chân lông. Công thức lâu trôi giúp duy trì lớp trang điểm rạng rỡ suốt ngày dài mà không gây bí da.',
    specs: { 'Dung tích': '30ml', 'Thương hiệu': 'B.O.M (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 185
},
{
    id: 32,
    name: 'Phấn Phủ Dạng Nén Kiềm Dầu, Mịn Da B.O.M Fixing Flex Powder Pact 7.5g',
    brand: 'B.O.M',
    category: 'trang-diem-nen',
    price: 189000,
    oldPrice: 320000,
    discount: '41%',
    image: 'https://product.hstatic.net/1000006063/product/1060_4669370f245643b5a1622a7aa0c7c1c9_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/1060_4669370f245643b5a1622a7aa0c7c1c9_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/1057_62788948b7cb471c8f09460f9cc6b246_870c1cb506104a629041fbefb640b580_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/1060_4669370f245643b5a1622a7aa0c7c1c9_1024x1024.jpg'
    ],
    description: 'Phấn phủ dạng nén B.O.M Fixing Flex Powder Pact với khả năng kiềm dầu vượt trội, giúp cố định lớp trang điểm và mang lại làn da mịn màng, không bóng nhờn.',
    details: 'Phấn phủ nén B.O.M Fixing Flex Powder Pact sở hữu hạt phấn siêu nhỏ, mịn màng, dễ dàng che phủ lỗ chân lông và các khuyết điểm nhỏ. Công thức kiềm dầu hiệu quả giúp duy trì lớp nền khô thoáng suốt nhiều giờ liền.',
    specs: { 'Khối lượng': '7.5g', 'Thương hiệu': 'B.O.M (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 150
},
{
    id: 33,
    name: 'Nước Tẩy Trang Chiết Xuất 8 Loại Trà B.O.M Eight Tea Cleansing Water 500ml',
    brand: 'B.O.M',
    category: 'cham-soc-da',
    price: 169000,
    oldPrice: 320000,
    discount: '47%',
    image: 'https://product.hstatic.net/1000006063/product/b.o.m_copy_a47a1f15c76d41d8a2d94a76f489a74b_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/b.o.m_copy_a47a1f15c76d41d8a2d94a76f489a74b_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/3_95e0468d512f400b9a41c46622533f4c_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/download__5__a0c7113e4ef5408f99535ec32e77dbe5_1024x1024.jpg'
    ],
    description: 'Nước tẩy trang B.O.M Eight Tea Cleansing Water giúp làm sạch sâu bụi bẩn, bã nhờn và lớp trang điểm một cách dịu nhẹ nhờ chiết xuất từ 8 loại trà thảo mộc.',
    details: 'Sản phẩm có độ pH 5.5 lý tưởng, không gây khô căng da sau khi sử dụng. Chiết xuất từ 8 loại trà giúp làm dịu da nhạy cảm, chống oxy hóa và duy trì độ ẩm tự nhiên.',
    specs: { 'Dung tích': '500ml', 'Thương hiệu': 'B.O.M (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Hạn sử dụng': '3 năm' },
    sold: 890
},
{
    id: 34,
    name: 'Son Thỏi Thuần Chay, Lì Mịn Như Mây B.O.M Cloud Blur Lipstick 3.3g',
    brand: 'B.O.M',
    category: 'trang-diem-son-moi',
    price: 179000,
    oldPrice: 320000,
    discount: '44%',
    image: 'https://product.hstatic.net/1000006063/product/bom_1d91920c26cc4c96b4ac5b5f5d925b77_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/bom_1d91920c26cc4c96b4ac5b5f5d925b77_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/2_f3a11550edfd4a958ed0b93eb8675538_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/3_88978aeb360e45a7ae5074e35bcc29aa_1024x1024.jpg'
    ],
    description: 'Son thỏi lì B.O.M Cloud Blur Lipstick với công thức thuần chay lành tính, mang lại hiệu ứng mờ lì mịn mượt như mây, mỏng nhẹ và bền màu trên môi.',
    details: 'B.O.M Cloud Blur Lipstick sở hữu chất son mềm mượt, dễ tán, giúp che phủ rãnh môi hiệu quả. Sản phẩm đạt chứng nhận thuần chay (Vegan), an toàn và nhẹ tênh trên môi suốt cả ngày dài.',
    specs: { 'Khối lượng': '3.3g', 'Thương hiệu': 'B.O.M (Hàn Quốc)', 'Nơi sản xuất': 'Hàn Quốc', 'Đặc tính': 'Thuần chay (Vegan)' },
    sold: 560
},
{
    id: 35,
    name: 'Serum Chống Nắng La Roche-Posay Siêu Mỏng, Kiềm Dầu, Cấp Ẩm Innovation Anthelios UVAir Sunscreen SPF50+ 30ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 495000,
    oldPrice: 640000,
    discount: '23%',
    image: 'https://cdn.hstatic.net/products/1000006063/1_641d8e8584f545068f540597dc13ca67_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/1_641d8e8584f545068f540597dc13ca67_1024x1024.png',
        'https://cdn.hstatic.net/products/1000006063/la_roche-posay_e_copy_2_0e2c7816a8f547fdabc59a70e74a14f4_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/4_8b0df47446a748edb0efb3542df824bb_1024x1024.jpg'
    ],
    description: 'Serum chống nắng thế hệ mới Innovation Anthelios UVAir với kết cấu siêu mỏng nhẹ, giúp kiềm dầu và cấp ẩm suốt 24h, bảo vệ da tối ưu trước tia UV.',
    details: 'Sản phẩm sở hữu công nghệ cải tiến mang đến màng lọc chống nắng phổ rộng nhưng vẫn giữ được kết cấu dạng serum nhẹ tênh, thấm nhanh không để lại vệt trắng. Phù hợp cho mọi loại da, đặc biệt là da dầu và da nhạy cảm.',
    specs: { 'Dung tích': '30ml', 'Chỉ số': 'SPF50+ PA++++', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Kết cấu': 'Dạng serum mỏng nhẹ' },
    sold: 120
},
{
    id: 36,
    name: 'Kem Dưỡng La Roche-Posay Kiềm Dầu, Cải Thiện Lỗ Chân Lông Effaclar Mat 40ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 389000,
    oldPrice: 525000,
    discount: '26%',
    image: 'https://cdn.hstatic.net/products/1000006063/1_81edea4ff8e943d1a450df07e2df5ee4_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/1_81edea4ff8e943d1a450df07e2df5ee4_1024x1024.png',
        'https://cdn.hstatic.net/products/1000006063/lr_2da5bf32d5d147c283b8c66012e47200_1024x1024.jpg',
        'https://cdn.hstatic.net/products/1000006063/h5_875ca43596ff415999018544da41fa04_1024x1024.jpeg'
    ],
    description: 'Kem dưỡng La Roche-Posay Effaclar Mat giúp kiềm dầu suốt 8h, se khít lỗ chân lông và mang lại làn da mịn lì tự nhiên.',
    details: 'Effaclar Mat sở hữu công thức không dầu (oil-free) kết hợp cùng Sebulyse giúp kiểm soát bã nhờn hiệu quả hơn cả kẽm. Sản phẩm thẩm thấu nhanh, không gây bết dính, lý tưởng để làm lớp lót trang điểm cho da dầu nhạy cảm.',
    specs: { 'Dung tích': '40ml', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Loại da': 'Da dầu, da mụn nhạy cảm', 'Đặc tính': 'Kiềm dầu, se lỗ chân lông' },
    sold: 840
}
,
{
    id: 37,
    name: 'Kem Dưỡng Hỗ Trợ Làm Trắng Da, Giảm Thâm Nám La Roche-Posay Mela B3 Cream 40ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 825000,
    oldPrice: 950000,
    discount: '13%',
    image: 'https://cdn.hstatic.net/products/1000006063/3_9cd59308f5f949a2a2879ab3968ec055_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/3_9cd59308f5f949a2a2879ab3968ec055_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/la_roche-posay_e_copy_2_eb1544f7763a4820b728b7a04b37c67d_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/sg-11134201-7rd5q-lvsh3ggdgm4521_b69df224824243db864da577d2852195_1024x1024.jpg'
    ],
    description: 'Kem dưỡng hỗ trợ làm trắng da, mờ thâm nám La Roche-Posay Mela B3 Cream giúp cải thiện sắc tố da, làm đều màu da và ngăn ngừa sự hình thành các đốm nâu mới.',
    details: 'Mela B3 Cream chứa thành phần đột phá Melasyl™ kết hợp cùng 10% Niacinamide giúp giải quyết tận gốc nguyên nhân gây thâm nám. Sản phẩm mang lại hiệu quả rõ rệt sau 4 tuần sử dụng, giúp da sáng mịn và rạng rỡ hơn.',
    specs: { 'Dung tích': '40ml', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Thành phần': 'Melasyl™, 10% Niacinamide', 'Loại da': 'Mọi loại da, da thâm nám' },
    sold: 150
},
{
    id: 38,
    name: 'Gel Rửa Mặt & Tắm La Roche-Posay Effaclar Micro-Peeling Purifying Gel 400ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 485000,
    oldPrice: 625000,
    discount: '22%',
    image: 'https://product.hstatic.net/1000006063/product/26_e8bfd61716b64bbfb7526f1ec9f67bc5_1024x1024.png',
    images: [
        'https://product.hstatic.net/1000006063/product/26_e8bfd61716b64bbfb7526f1ec9f67bc5_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/74e6c93a3137612d794eab2b2266d358_1ad4c2ce42264f8d9b3bf651bbce4b9e_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/zoom-front-210004_ba17c06cc7bf41adab4f9a5439ac1c56_1024x1024.jpg'
    ],
    description: 'Gel rửa mặt và tắm dành cho da dầu mụn với thành phần Salicylic Acid và LHA giúp làm sạch sâu, giảm mụn sưng viêm và ngăn ngừa mụn tái phát.',
    details: 'La Roche-Posay Effaclar Micro-Peeling Purifying Gel là gel rửa mặt dành cho da dầu, mụn trứng cá nghiêm trọng và mụn cơ thể. Với 2% Salicylic Acid và LHA, sản phẩm giúp làm sạch sâu lỗ chân lông, loại bỏ tế bào chết và bã nhờn dư thừa, làm giảm mụn sưng viêm rõ rệt và ngăn ngừa vết thâm sau mụn.',
    specs: { 'Dung tích': '400ml', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Thành phần': '2% Salicylic Acid, LHA, Zinc', 'Loại da': 'Da dầu, da mụn nghiêm trọng' },
    sold: 340
},
{
    id: 39,
    name: 'Sữa Rửa Mặt La Roche-Posay Cho Da Dầu Mụn Effaclar Purifying Foaming Gel 400ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 445000,
    oldPrice: 560000,
    discount: '21%',
    image: 'https://cdn.hstatic.net/products/1000006063/12_95e900c7b6164e418d924f0f3c6b95ef_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/12_95e900c7b6164e418d924f0f3c6b95ef_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/a_roche-posay_effaclar_purifying_foaming_gel_for_oily_sensitive_skin_3_39c1f4880f594637983417111e449355_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/5_b40da5596e6b445cba47b190d3294359_1024x1024_6ae7be4f1542407294d65d6f659874bb_1024x1024.jpg'
    ],
    description: 'Gel rửa mặt tạo bọt dành cho da dầu, nhạy cảm giúp làm sạch bụi bẩn và bã nhờn dư thừa, mang lại làn da sạch thoáng và cân bằng.',
    details: 'Sữa rửa mặt La Roche-Posay Effaclar Purifying Foaming Gel nhẹ nhàng làm sạch da từ sâu trong lỗ chân lông, loại bỏ bụi bẩn cùng dầu thừa, đồng thời giữ độ pH luôn ở mức cân bằng 5.5 giúp da không bị khô căng sau khi rửa.',
    specs: { 'Dung tích': '400ml', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Loại da': 'Da dầu & da mụn nhạy cảm', 'Kết cấu': 'Dạng gel tạo bọt' },
    sold: 15500
},
{
    id: 40,
    name: 'Nước Tẩy Trang La Roche-Posay Cho Da Dầu Mụn Effaclar Micellar Water Ultra 400ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 395000,
    oldPrice: 525000,
    discount: '25%',
    image: 'https://product.hstatic.net/1000006063/product/4_d9cd1f1ffdcf402aa64f0095ae8202bd_1024x1024.png',
    images: [
        'https://product.hstatic.net/1000006063/product/4_d9cd1f1ffdcf402aa64f0095ae8202bd_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/2_9e68389d85cb4aaca96c101051bbc110_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/3_d241d88fac304c5a9fabe0a3306b785f_1024x1024.jpg'
    ],
    description: 'Nước tẩy trang công nghệ Micellar dành cho da dầu mụn giúp làm sạch sâu lớp trang điểm, bụi mịn và bã nhờn mà không gây khô da.',
    details: 'Effaclar Micellar Water Ultra giúp làm sạch đến 99% lớp trang điểm, 70% mascara và các hạt bụi siêu mịn chỉ sau một miếng bông. Thành phần chứa Zinc PCA giúp kiểm soát dầu và nước khoáng La Roche-Posay làm dịu da.',
    specs: { 'Dung tích': '400ml', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Loại da': 'Da dầu, da mụn, nhạy cảm', 'Công nghệ': 'Glyco Micellar' },
    sold: 4200
},
{
    id: 41,
    name: 'Nước Tẩy Trang La Roche-Posay Cho Da Nhạy Cảm Micellar Water Ultra Sensitive Skin 400ml',
    brand: 'La Roche-Posay',
    category: 'cham-soc-da',
    price: 395000,
    oldPrice: 525000,
    discount: '25%',
    image: 'https://cdn.hstatic.net/products/1000006063/16_35a6bd73494d41dd8cb945af4bcd9db3_1024x1024.png',
    images: [
        'https://cdn.hstatic.net/products/1000006063/16_35a6bd73494d41dd8cb945af4bcd9db3_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/la_roche-posay_micellar_water_ultra_sensitive_skin_06be85eaf44b4597be3d8b6db0eb8b72_1024x1024.jpeg',
        'https://product.hstatic.net/1000006063/product/z6081464560649_1025bbf578d8f6f9e82fd831634c07af_f139cc02fc9448d18cd23c01b671b485_1024x1024.jpg'
    ],
    description: 'Nước tẩy trang dành cho da nhạy cảm giúp làm sạch sâu lớp trang điểm và bụi mịn mà không gây khô da hay kích ứng.',
    details: 'Micellar Water Ultra Sensitive Skin giúp làm sạch sâu lớp trang điểm, bụi mịn và bã nhờn, đồng thời cấp ẩm và làm dịu da nhạy cảm. Công thức chứa Glycerin giúp dưỡng ẩm và giảm ma sát tối đa khi làm sạch, đảm bảo an toàn cho cả vùng da mắt và môi.',
    specs: { 'Dung tích': '400ml', 'Thương hiệu': 'La Roche-Posay (Pháp)', 'Loại da': 'Da nhạy cảm', 'Công nghệ': 'Glyco Micellar' },
    sold: 3500
},
{
    id: 42,
    name: 'Gel Chống Nắng Dịu Nhẹ Cho Da Nhạy Cảm & Trẻ Em Anessa Moisture UV Sunscreen Mild Gel SPF35/PA+++ 90g',
    brand: 'Anessa',
    category: 'cham-soc-da',
    price: 369000,
    oldPrice: 485000,
    discount: '24%',
    image: 'https://product.hstatic.net/1000006063/product/anessa_e_copy_2_a64b87c0efed4a17b83070d3345ef905_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/anessa_e_copy_2_a64b87c0efed4a17b83070d3345ef905_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/z6687283442849_0cadcf4547cbe266fa3c4134ba42f073_0cca78944872482d8e6beba19b40b6b3_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/vn-11134207-7r98o-lt39m2gtw5g952_8d3683b3dda342178110414cd1edc097_1024x1024.jpg'
    ],
    description: 'Gel chống nắng dịu nhẹ, dưỡng ẩm tối ưu cho làn da nhạy cảm và trẻ em, bảo vệ da trước tia UV và bụi mịn.',
    details: 'Anessa Moisture UV Sunscreen Mild Gel với công thức 5 không (không cồn, màu, mùi, paraben, dầu khoáng), an toàn tuyệt đối cho làn da nhạy cảm nhất và cả trẻ em. Kết cấu gel ẩm mượt giúp duy trì độ mịn màng cho da suốt ngày dài.',
    specs: { 'Khối lượng': '90g', 'Thương hiệu': 'Anessa (Nhật Bản)', 'Chỉ số': 'SPF35/PA+++', 'Loại da': 'Da nhạy cảm, trẻ em' },
    sold: 1200
},
{
    id: 43,
    name: 'Gel Chống Nắng Dưỡng Sáng, Nâng Tông Anessa Brightening UV Sunscreen Gel SPF50+/PA++++ 90g',
    brand: 'Anessa',
    category: 'cham-soc-da',
    price: 395000,
    oldPrice: 575000,
    discount: '31%',
    image: 'https://product.hstatic.net/1000006063/product/anessa_tone_up_brightening_uv_sunscreen_gel__6141635759054be09aef5eedf9f2c2d6_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/anessa_tone_up_brightening_uv_sunscreen_gel__6141635759054be09aef5eedf9f2c2d6_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/5_02f5db58203a4094a2e6c79263b381ab_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/6_b5d683c3bb1046348ea10451ec67634f_1024x1024.jpg'
    ],
    description: 'Gel chống nắng dưỡng sáng da, ngăn ngừa thâm nám và nâng tông nhẹ nhàng với chỉ số chống nắng cao SPF50+ PA++++.',
    details: 'Anessa Brightening UV Sunscreen Gel chứa thành phần dưỡng sáng da m-Tranexamic Acid giúp mờ thâm nám. Kết cấu gel ẩm mượt với sắc hồng tím nhẹ giúp hiệu chỉnh tông da, mang lại vẻ rạng rỡ tức thì.',
    specs: { 'Khối lượng': '90g', 'Thương hiệu': 'Anessa (Nhật Bản)', 'Chỉ số': 'SPF50+/PA++++', 'Đặc tính': 'Dưỡng sáng, nâng tông' },
    sold: 850
},
{
    id: 44,
    name: 'Sữa Chống Nắng Anessa Dịu Nhẹ Cho Da Nhạy Cảm & Em Bé Perfect UV Sunscreen Mild Milk SPF50+/PA++++ 60ml',
    brand: 'Anessa',
    category: 'cham-soc-da',
    price: 445000,
    oldPrice: 685000,
    discount: '35%',
    image: 'https://product.hstatic.net/1000006063/product/anessa_e_copy_2_d9f98cf5a11e4349af635e8915875cbd_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/anessa_e_copy_2_d9f98cf5a11e4349af635e8915875cbd_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/bthe_2e4d05fa682a48e186a60839f42bd311_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/vn-11134207-7r98o-lsmiwacsl6mc82_c7bc5a9b34674b1b83620e5af25f849e_1024x1024.jpg'
    ],
    description: 'Sữa chống nắng dịu nhẹ dành cho da nhạy cảm và trẻ em với công nghệ Smooth Protect giúp bảo vệ da tối ưu trước tia UV và bụi mịn.',
    details: 'Anessa Perfect UV Sunscreen Mild Milk là kem chống nắng dạng sữa cực kỳ dịu nhẹ, không chứa cồn, màu, mùi hay paraben. Sản phẩm thẩm thấu nhanh, mang lại lớp nền mịn mượt và bảo vệ da bền bỉ ngay cả trong môi trường nóng ẩm.',
    specs: { 'Dung tích': '60ml', 'Thương hiệu': 'Anessa (Nhật Bản)', 'Chỉ số': 'SPF50+/PA++++', 'Loại da': 'Da nhạy cảm, em bé' },
    sold: 1500
},
{
    id: 45,
    name: 'Sữa Chống Nắng Anessa Bảo Vệ Hoàn Hảo Perfect UV Sunscreen Skincare Milk SPF50+/PA++++ 60ml',
    brand: 'Anessa',
    category: 'cham-soc-da',
    price: 515000,
    oldPrice: 715000,
    discount: '28%',
    image: 'https://product.hstatic.net/1000006063/product/anessa_e_copy_2_807fe7318e944a3680effcfae3ad0c3a_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/anessa_e_copy_2_807fe7318e944a3680effcfae3ad0c3a_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/download__21__6e7729bbc0764785aef2096deeabb221_1024x1024.jpeg',
        'https://product.hstatic.net/1000006063/product/download__20__de7b795d0f52475ab06ab52e4bd01de0_1024x1024.jpeg'
    ],
    description: 'Sữa chống nắng bảo vệ hoàn hảo với công nghệ Auto Booster giúp màng lọc chống tia UV trở nên bền vững hơn khi gặp nhiệt độ cao, độ ẩm, nước và mồ hôi.',
    details: 'Anessa Perfect UV Sunscreen Skincare Milk tích hợp công nghệ chống trôi tối ưu, bảo vệ da toàn diện trong mọi điều kiện môi trường khắc nghiệt nhất mà vẫn duy trì độ ẩm mịn nhờ 50% thành phần dưỡng da.',
    specs: { 'Dung tích': '60ml', 'Thương hiệu': 'Anessa (Nhật Bản)', 'Chỉ số': 'SPF50+/PA++++', 'Loại da': 'Mọi loại da, đặc biệt da dầu' },
    sold: 18200
},
{
    id: 46,
    name: 'Xịt Chống Nắng Anessa Dưỡng Da Đa Năng SPF50+ PA++++ 60g',
    brand: 'Anessa',
    category: 'cham-soc-da',
    price: 355000,
    oldPrice: 435000,
    discount: '18%',
    image: 'https://cocolux.com/storage/upload_image/files/xit-chong-nang-anessa-duong-da-da-nang-spf50-pa-60g-6.jpg',
    images: [
        'https://cocolux.com/storage/upload_image/files/xit-chong-nang-anessa-duong-da-da-nang-spf50-pa-60g-6.jpg',
        'https://cocolux.com/storage/upload_image/files/xit-chong-nang-anessa-duong-da-da-nang-spf50-pa-60g-3.jpg',
        'https://cocolux.com/storage/upload_image/files/xit-chong-nang-anessa-duong-da-da-nang-spf50-pa-60g.jpg'
    ],
    description: 'Xịt chống nắng dưỡng da đa năng bảo vệ da hoàn hảo trước tia UV & bụi mịn, dùng cho cả mặt, tóc và cơ thể.',
    details: 'Xịt Chống Nắng Anessa Perfect UV Sunscreen Skincare Spray với công nghệ Auto Booster giúp màng lọc chống tia UV trở nên bền vững hơn khi gặp Nhiệt độ cao - Độ ẩm - Nước - Mồ hôi. Kết cấu mỏng nhẹ, khô ráo, có thể dùng trước và sau khi trang điểm.',
    specs: { 'Khối lượng': '60g', 'Thương hiệu': 'Anessa (Nhật Bản)', 'Chỉ số': 'SPF50+ PA++++', 'Loại da': 'Mọi loại da' },
    sold: 5200
},
{
    id: 47,
    name: 'Mặt Nạ Nghệ Hưng Yên Cocoon Sáng Da, Giảm Thâm 30ml',
    brand: 'Cocoon',
    category: 'skincare',
    price: 129000,
    oldPrice: 165000,
    discount: '21%',
    image: 'https://product.hstatic.net/1000006063/product/30_8d1f5a4cf76143328267195c327ae4c4_1024x1024_0db834a4c3a7416bb63f91b382d339dd_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/30_8d1f5a4cf76143328267195c327ae4c4_1024x1024_0db834a4c3a7416bb63f91b382d339dd_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/cocoon_turmeric_face_mask_30ml_61f301f004ad4ede8244a8ead2654350_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/mask_nghe_4c4b329de73f4b27a2163a4db56db0cb_1024x1024.jpg'
    ],
    description: 'Mặt nạ nghệ Hưng Yên giúp làm sáng da, mờ thâm và mang lại làn da rạng rỡ, mịn màng.',
    details: 'Mặt nạ nghệ Hưng Yên chứa chiết xuất nghệ từ vùng đất Hưng Yên kết hợp cùng Vitamin B3 và chiết xuất yến mạch. Sản phẩm giúp loại bỏ tế bào chết, cải thiện bề mặt da, làm mờ các vết thâm và dưỡng sáng da tự nhiên mà không gây vàng da sau khi sử dụng.',
    specs: { 'Dung tích': '30ml', 'Thương hiệu': 'Cocoon (Việt Nam)', 'Thành phần chính': 'Nghệ, Vitamin B3', 'Loại da': 'Mọi loại da' },
    sold: 2100
},
{
    id: 48,
    name: 'Kem Ủ Tóc Bưởi Cocoon Giảm Gãy Rụng Tóc, Mềm Mượt 200ml',
    brand: 'Cocoon',
    category: 'cham-soc-toc',
    price: 165000,
    oldPrice: 215000,
    discount: '23%',
    image: 'https://product.hstatic.net/1000006063/product/cocoon_pomelo_hair_mask_200ml_1c1d6fc3b2d242e285c4a2f79dfeb934_1024x1024.jpg',
    images: [
        'https://product.hstatic.net/1000006063/product/cocoon_pomelo_hair_mask_200ml_1c1d6fc3b2d242e285c4a2f79dfeb934_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/7_5734334c12f144e88a1fc5af8771a808_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/9_73d05053102040fa9f59fd57eb81a5f8_1024x1024.jpg'
    ],
    description: 'Kem ủ tóc bưởi Cocoon với tinh dầu vỏ bưởi, Vitamin B5 và Xylishine giúp giảm gãy rụng và làm mềm mượt tóc hiệu quả.',
    details: 'Kem ủ tóc bưởi Cocoon chứa tinh dầu vỏ bưởi truyền thống kết hợp với Vitamin B5 và hoạt chất dưỡng ẩm giúp nuôi dưỡng tóc chắc khỏe từ gốc đến ngọn, giảm tình trạng tóc gãy rụng và mang lại vẻ bóng mượt tự nhiên.',
    specs: { 'Dung tích': '200ml', 'Thương hiệu': 'Cocoon (Việt Nam)', 'Nơi sản xuất': 'Việt Nam', 'Hạn sử dụng': '3 năm' },
    sold: 1800
},
{
    id: 49,
    name: 'Kem Dưỡng Gel Bí Đao Cocoon Giảm Mụn, Mờ Thâm 30ml',
    brand: 'Cocoon',
    category: 'cham-soc-da',
    price: 195000,
    oldPrice: 260000,
    discount: '25%',
    image: 'https://product.hstatic.net/1000006063/product/18_9a6f482ae5e74855a7c0c74bcee51ce0_1024x1024.png',
    images: [
        'https://product.hstatic.net/1000006063/product/18_9a6f482ae5e74855a7c0c74bcee51ce0_1024x1024.png',
        'https://product.hstatic.net/1000006063/product/z2188849104724_38d06f829bd4ce6bd61097f5b93aa2b9_900x_a0e544b99d614802ab720fda28a070c7_1024x1024.jpg',
        'https://product.hstatic.net/1000006063/product/242175534_4325988320830094_1002399940995592185_n_b48f3071b06943d49de042f7a90b0037_1024x1024.jpg'
    ],
    description: 'Kem dưỡng dạng gel chiết xuất bí đao giúp kiểm soát dầu, giảm mụn và làm dịu da, mang lại làn da thông thoáng, mịn màng.',
    details: 'Kem dưỡng bí đao Cocoon với công thức thuần chay, không cồn, không paraben, an toàn cho da mụn nhạy cảm. Sản phẩm giúp cấp ẩm nhẹ nhàng, giảm sưng viêm mụn và làm mờ các vết thâm sau mụn hiệu quả.',
    specs: { 'Dung tích': '30ml', 'Thương hiệu': 'Cocoon (Việt Nam)', 'Thành phần chính': 'Bí đao, Rau má, Tràm trà', 'Loại da': 'Da dầu mụn, nhạy cảm' },
    sold: 950
}
];

products = [...DEFAULT_PRODUCTS];
filteredProducts = [...products];

async function loadProductsFromServer() {
    try {
        // Hiển thị ngay dữ liệu mặc định để người dùng không phải chờ
        renderAllSections();

        const data = await safeFetch(`${API_BASE_URL}/products`);
        if (data && Array.isArray(data) && data.length > 0) {
            products = data;
            window.products = products;
            filteredProducts = [...products]; 
            // Cập nhật lại giao diện khi đã có dữ liệu từ Server
            renderAllSections();
        }
    } catch (error) {
        console.warn('Không thể kết nối Backend, đang dùng dữ liệu dự phòng.');
    }
}

const magazinePosts = [
    {
        id: 1,
        title: "Bí quyết trang điểm tự nhiên như không cho nàng công sở",
        category: "makeup-tips",
        categoryName: "Bí quyết trang điểm",
        date: "06/04/2026",
        description: "Làm thế nào để có một lớp nền mỏng nhẹ, tự nhiên nhưng vẫn che được khuyết điểm? Hãy cùng khám phá các bước trang điểm đơn giản nhất.",
        thumbnail: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
        content: "Nội dung chi tiết về bí quyết trang điểm tự nhiên... <br><br> Bước 1: Làm sạch da... <br> Bước 2: Kem lót... <br> Bước 3: Phấn nước mỏng nhẹ..."
    },
    {
        id: 2,
        title: "Quy trình chăm sóc da chuyên sâu cho da dầu mụn",
        category: "skincare-tips",
        categoryName: "Chăm sóc da chuyên sâu",
        date: "05/04/2026",
        description: "Da dầu mụn cần một chế độ chăm sóc đặc biệt để kiểm soát dầu thừa và ngăn ngừa vi khuẩn gây mụn phát triển.",
        thumbnail: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
        content: "Nội dung chi tiết về chăm sóc da dầu mụn... <br><br> Sử dụng sữa rửa mặt chứa Salicylic Acid... <br> Toner không cồn... <br> Serum trị mụn..."
    },
    {
        id: 3,
        title: "Review chi tiết bộ sản phẩm dưỡng trắng da Laneige",
        category: "review",
        categoryName: "Review mỹ phẩm",
        date: "04/04/2026",
        description: "Cùng xem thử bộ sản phẩm dưỡng trắng đình đám của Laneige có thực sự hiệu quả như lời đồn hay không nhé.",
        thumbnail: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
        content: "Đánh giá chi tiết về Laneige Radian-C... <br><br> Ưu điểm: Thấm nhanh, mùi thơm nhẹ... <br> Nhược điểm: Giá hơi cao..."
    },
    {
        id: 4,
        title: "Top 5 kem chống nắng được yêu thích nhất mùa hè 2026",
        category: "top-products",
        categoryName: "Top mỹ phẩm",
        date: "03/04/2026",
        description: "Mùa hè nắng gắt, việc chọn một loại kem chống nắng phù hợp là vô cùng quan trọng để bảo vệ làn da của bạn.",
        thumbnail: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80",
        content: "Danh sách 5 kem chống nắng tốt nhất... <br><br> 1. La Roche-Posay Anthelios... <br> 2. Anessa Perfect UV..."
    }
];

function removeAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// 3. INIT
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.includes('admin.html')) {
        return;
    }
    
    injectRequiredElements();
    initEvents(); // Hàm này chứa window.initCheckoutListeners()

    if (isLoggedIn && currentUserName) {
        updateUserDisplay(currentUserName);
    }

    loadProductsFromServer();
    
    updateCartUI();
    startSlider();
    startCountdown();
});

function renderAllSections() {
    if (document.getElementById('productGrid')) renderProducts();
    if (document.getElementById('flashSaleGrid')) renderFlashSale();
    if (document.getElementById('merzyProductsGrid')) renderMerzyProducts();
    if (document.getElementById('makeupGrid')) renderMakeupProducts();
    if (document.getElementById('sunCareGrid')) renderSunCareProducts();
    if (document.getElementById('maskGrid')) renderMaskProducts();
    if (document.getElementById('localBrandGrid')) renderLocalBrandProducts();
    if (document.getElementById('skinCareSectionGrid')) renderSkinCareSectionProducts();
    if (document.getElementById('bodyCareSectionGrid')) renderBodyCareSectionProducts();
    if (document.getElementById('hairCareGrid')) renderHairCareProducts();
    if (document.getElementById('makeupSectionGrid')) renderMakeupSectionProducts();
    updateHomeSectionCounts();
    initHorizontalProductScroll();

    // Xử lý các trang đặc biệt
    const path = window.location.pathname;
    if (path.includes('category.html')) handleCategoryPage();
    if (path.includes('magazine.html') && !path.includes('detail')) handleMagazinePage();
    if (path.includes('magazine-detail.html')) handleMagazineDetailPage();
}

function initHorizontalProductScroll() {
    const grids = document.querySelectorAll('.products-grid');

    grids.forEach((grid) => {
        if (grid.dataset.hScrollInit === '1') return;
        grid.dataset.hScrollInit = '1';

        let isDown = false;
        let startX;
        let scrollLeft;
        let isDragging = false;
        
        // --- Hover Auto Scroll Logic ---
        let hoverSpeed = 0;
        let targetHoverSpeed = 0;
        let rafId = null;

        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const tickAutoScroll = () => {
            // Làm mượt tốc độ cuộn bằng lerp
            hoverSpeed = lerp(hoverSpeed, targetHoverSpeed, 0.1);
            
            if (Math.abs(hoverSpeed) > 0.1) {
                grid.classList.add('no-snap'); 
                grid.scrollLeft += hoverSpeed;
                rafId = requestAnimationFrame(tickAutoScroll);
            } else {
                grid.classList.remove('no-snap');
                hoverSpeed = 0;
                rafId = null;
            }
        };

        const updateTargetSpeed = (speed) => {
            targetHoverSpeed = speed;
            if (targetHoverSpeed !== 0 && !rafId) {
                rafId = requestAnimationFrame(tickAutoScroll);
            }
        };

        // --- Drag Logic ---
        grid.addEventListener('mousedown', (e) => {
            isDown = true;
            isDragging = false;
            grid.classList.add('grabbing');
            startX = e.pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
            grid.style.scrollBehavior = 'auto'; // Tắt smooth của CSS khi đang kéo manual
            updateTargetSpeed(0); // Dừng auto scroll khi đang kéo
        });

        grid.addEventListener('mouseleave', () => {
            isDown = false;
            grid.classList.remove('grabbing');
            updateTargetSpeed(0);
        });

        grid.addEventListener('mouseup', () => {
            isDown = false;
            grid.classList.remove('grabbing');
            grid.style.scrollBehavior = 'smooth';
            
            if (isDragging) {
                const preventClick = (e) => {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    grid.removeEventListener('click', preventClick, true);
                };
                grid.addEventListener('click', preventClick, true);
            }
        });

        grid.addEventListener('mousemove', (e) => {
            if (isDown) {
                const x = e.pageX - grid.offsetLeft;
                const walk = (x - startX) * 2;
                if (Math.abs(x - startX) > 5) {
                    isDragging = true;
                    grid.scrollLeft = scrollLeft - walk;
                }
                return;
            }

            // Hover detecting near edges
            const rect = grid.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const threshold = 120; // Vùng cảm ứng ở 2 đầu
            const maxSpeed = 15;

            if (mouseX > rect.width - threshold) {
                const intensity = (mouseX - (rect.width - threshold)) / threshold;
                updateTargetSpeed(Math.round(intensity * maxSpeed));
            } else if (mouseX < threshold) {
                const intensity = (threshold - mouseX) / threshold;
                updateTargetSpeed(-Math.round(intensity * maxSpeed));
            } else {
                updateTargetSpeed(0);
            }
        });

        // Touch support (Native is fine, but we can ensure it works well)
        grid.addEventListener('touchstart', () => {
            grid.style.scrollBehavior = 'auto';
            updateTargetSpeed(0);
        }, { passive: true });

        grid.addEventListener('touchend', () => {
            grid.style.scrollBehavior = 'smooth';
        }, { passive: true });
    });
}

// 3.1 CATEGORY PAGE LOGIC
function handleCategoryPage() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'all';
    const q = params.get('q') || '';
    const brandParam = params.get('brand') || '';
    
    const categoryMap = {
        'trang-diem': { title: 'TRANG ĐIỂM', banner: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80' },
        'skincare': { title: 'CHĂM SÓC DA', banner: 'https://images.unsplash.com/photo-1570172619384-210fa1de8bd8?auto=format&fit=crop&w=1200&q=80' },
        'bodycare': { title: 'CHĂM SÓC CƠ THỂ', banner: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=80' },
        'haircare': { title: 'CHĂM SÓC TÓC', banner: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80' },
        'perfume': { title: 'NƯỚC HOA', banner: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80' },
        'brands': { title: 'THƯƠNG HIỆU', banner: 'https://images.unsplash.com/photo-1596462502278-27bfad450526?auto=format&fit=crop&w=1200&q=80' },
        'magazine': { title: 'TẠP CHÍ LÀM ĐẸP', banner: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80' },
        'new': { title: 'SẢN PHẨM MỚI', banner: 'https://images.unsplash.com/photo-1596462502278-27bfad450526?auto=format&fit=crop&w=1200&q=80' },
        'combo': { title: 'COMBO CHĂM DA', banner: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1200&q=80' }
    };

    let config = categoryMap[type] || { title: 'TẤT CẢ SẢN PHẨM', banner: 'https://images.unsplash.com/photo-1596462502278-27bfad450526?auto=format&fit=crop&w=1200&q=80' };

    if (q) {
        config = { title: `KẾT QUẢ TÌM KIẾM: "${q}"`, banner: 'https://images.unsplash.com/photo-1596462502278-27bfad450526?auto=format&fit=crop&w=1200&q=80' };
    } else if (brandParam) {
        config = { title: `THƯƠNG HIỆU: ${brandParam.toUpperCase()}`, banner: 'https://images.unsplash.com/photo-1596462502278-27bfad450526?auto=format&fit=crop&w=1200&q=80' };
    }

    // Update UI
    const titleEl = document.getElementById('categoryTitle');
    const bannerEl = document.getElementById('categoryBanner');
    const breadcrumbEl = document.getElementById('breadcrumbCategory');
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    const gridEl = document.getElementById('categoryProductGrid');
    const countEl = document.getElementById('productCount');

    if (titleEl) titleEl.innerText = config.title;
    if (bannerEl) bannerEl.style.backgroundImage = `url('${config.banner}')`;
    if (breadcrumbEl) breadcrumbEl.innerText = config.title;

    const sidebarEl = document.querySelector('.category-sidebar');
    const layoutEl = document.querySelector('.category-layout');

    // Hide breadcrumbs and banner if searching
    if (q) {
        if (breadcrumbContainer) breadcrumbContainer.style.display = 'block';
        if (bannerEl) bannerEl.style.display = 'flex';
        if (sidebarEl) sidebarEl.style.display = 'block';
        if (layoutEl) layoutEl.style.gridTemplateColumns = '280px 1fr';
        if (gridEl) gridEl.style.gridTemplateColumns = 'repeat(4, 1fr)';
    } else {
        if (breadcrumbContainer) breadcrumbContainer.style.display = 'block';
        if (bannerEl) bannerEl.style.display = 'flex';
        if (sidebarEl) sidebarEl.style.display = 'block';
        if (layoutEl) layoutEl.style.gridTemplateColumns = '280px 1fr';
        if (gridEl) gridEl.style.gridTemplateColumns = 'repeat(4, 1fr)';
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput && q) {
        searchInput.value = q;
    }

    // Filter Products (Base list for sidebar to work on)
    let filtered = products;
    if (q) {
        const query = q.toLowerCase().trim();
        const queryNoAccent = removeAccents(query);
        filtered = products.filter(p => {
            const name = p.name.toLowerCase();
            const brand = p.brand.toLowerCase();
            const category = p.category.toLowerCase();
            const details = (p.details || "").toLowerCase();
            
            if (name.includes(query) || brand.includes(query) || category.includes(query) || details.includes(query)) return true;
            if (removeAccents(name).includes(queryNoAccent) || removeAccents(brand).includes(queryNoAccent) || removeAccents(category).includes(queryNoAccent) || removeAccents(details).includes(queryNoAccent)) return true;
            return false;
        });
    } else if (type === 'new') {
        filtered = products.filter(p => p.isNew);
    } else if (type === 'combo') {
        filtered = products.filter(p => p.category === 'combo');
    } else if (type !== 'all' && type !== 'brands' && type !== 'magazine') {
        // Hỗ trợ lọc cho cả slug tiếng Anh (từ URL) và tên category tiếng Việt (trong data)
        const typeMapping = {
            'skincare': 'cham-soc-da',
            'haircare': 'cham-soc-toc',
            'bodycare': 'cham-soc-body'
        };
        const targetType = typeMapping[type] || type;
        filtered = products.filter(p => 
            p.category === type || 
            p.category === targetType || 
            p.category.startsWith(type + '-') || 
            p.category.startsWith(targetType + '-')
        );
    }

    // Initial render
    if (gridEl) {
        renderFilteredProducts(filtered);
    }

    // Logic Sắp xếp
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            let sorted = [...filtered];
            if (sortSelect.value === 'price-asc') sorted.sort((a, b) => a.price - b.price);
            if (sortSelect.value === 'price-desc') sorted.sort((a, b) => b.price - a.price);
            renderFilteredProducts(sorted);
        });
    }

    function renderFilteredProducts(data) {
        if (gridEl) gridEl.innerHTML = data.map(p => createProductCard(p)).join('');
        if (countEl) countEl.innerText = data.length;
    }

    // SIDEBAR FILTER LOGIC
    const brandCheckboxes = document.querySelectorAll('.brand-checkbox');
    const priceCheckboxes = document.querySelectorAll('.price-checkbox');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const applyPriceBtn = document.getElementById('applyPriceBtn');

    // Sync brandParam with checkboxes
    if (brandParam) {
        brandCheckboxes.forEach(cb => {
            if (cb.value.toLowerCase() === brandParam.toLowerCase()) {
                cb.checked = true;
            }
        });
    }

    function applySidebarFilters() {
        const selectedBrands = Array.from(brandCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());
        
        const selectedPriceRanges = Array.from(priceCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value.split('-').map(Number));

        const minPrice = parseInt(minPriceInput.value) || 0;
        const maxPrice = parseInt(maxPriceInput.value) || 999999999;

        let sidebarFiltered = filtered;

        // Filter by Brand
        if (selectedBrands.length > 0) {
            sidebarFiltered = sidebarFiltered.filter(p => selectedBrands.includes(p.brand.toLowerCase()));
        }

        // Filter by Price Range (Checkboxes)
        if (selectedPriceRanges.length > 0) {
            sidebarFiltered = sidebarFiltered.filter(p => {
                return selectedPriceRanges.some(range => p.price >= range[0] && p.price <= range[1]);
            });
        }

        // Filter by Custom Price Range (Inputs) - only if inputs are used
        if (minPriceInput.value || maxPriceInput.value) {
            sidebarFiltered = sidebarFiltered.filter(p => p.price >= minPrice && p.price <= maxPrice);
        }

        if (gridEl) {
            gridEl.innerHTML = sidebarFiltered.map(p => createProductCard(p)).join('');
        }
        if (countEl) countEl.innerText = sidebarFiltered.length;
    }

    brandCheckboxes.forEach(cb => cb.addEventListener('change', applySidebarFilters));
    priceCheckboxes.forEach(cb => cb.addEventListener('change', applySidebarFilters));
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', applySidebarFilters);
    }

    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            brandCheckboxes.forEach(cb => cb.checked = false);
            priceCheckboxes.forEach(cb => cb.checked = false);
            minPriceInput.value = '';
            maxPriceInput.value = '';
            applySidebarFilters();
        });
    }

    // Apply filters initially (in case brandParam is present)
    applySidebarFilters();
}

// 3.2 MAGAZINE PAGE LOGIC
function handleMagazinePage() {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic') || 'all';
    
    renderMagazinePosts(topic);
    
    // Sidebar active state
    const sidebarItems = document.querySelectorAll('.mag-sidebar-item');
    sidebarItems.forEach(item => {
        if (item.dataset.topic === topic) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
        
        item.addEventListener('click', () => {
            const newTopic = item.dataset.topic;
            window.history.pushState({}, '', `magazine.html?topic=${newTopic}`);
            
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            renderMagazinePosts(newTopic);
        });
    });
}

function renderMagazinePosts(topic) {
    const grid = document.getElementById('magazineGrid');
    const titleEl = document.getElementById('magazineTitle');
    const breadcrumbEl = document.getElementById('breadcrumbTopic');
    
    if (!grid) return;
    
    let filtered = magazinePosts;
    let title = "TẤT CẢ BÀI VIẾT";
    
    if (topic !== 'all') {
        filtered = magazinePosts.filter(p => p.category === topic);
        if (filtered.length > 0) {
            title = filtered[0].categoryName.toUpperCase();
        }
    }
    
    if (titleEl) titleEl.innerText = title;
    if (breadcrumbEl) breadcrumbEl.innerText = topic === 'all' ? 'Tất cả' : title;
    
    grid.innerHTML = filtered.map(post => `
        <div class="magazine-card" onclick="location.href='magazine-detail.html?id=${post.id}'">
            <div class="mag-card-img">
                <img src="${post.thumbnail}" alt="${post.title}" referrerPolicy="no-referrer">
            </div>
            <div class="mag-card-body">
                <div class="mag-card-date">${post.date}</div>
                <h3 class="mag-card-title">${post.title}</h3>
                <p class="mag-card-desc">${post.description}</p>
                <span class="mag-card-more">Xem chi tiết &rarr;</span>
            </div>
        </div>
    `).join('');
}

function handleMagazineDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const id = parseInt(params.get('id'));
    const post = magazinePosts.find(p => p.id === id);
    
    if (!post) {
        document.getElementById('magazineDetailContent').innerHTML = "<h3>Không tìm thấy bài viết</h3>";
        return;
    }
    
    document.getElementById('magDetailTitle').innerText = post.title;
    document.getElementById('magDetailDate').innerText = post.date;
    document.getElementById('magDetailCategory').innerText = post.categoryName;
    document.getElementById('magDetailThumbnail').src = post.thumbnail;
    document.getElementById('magDetailBody').innerHTML = post.content;
    document.getElementById('breadcrumbPostTitle').innerText = post.title;
}

// 4. RENDER
function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = filteredProducts.map(p => createProductCard(p)).join('');
}

/**
 * Hàm dùng chung để render một nhóm sản phẩm dựa trên bộ lọc
 */
function renderProductSection(gridId, filterFn, options = {}) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const { limit = 100, isFlashSale = false } = options;
    const allFiltered = products.filter(filterFn);
    const items = allFiltered.slice(0, limit);

    grid.innerHTML = items.map(p => createProductCard(p, isFlashSale)).join('');
}

function renderFlashSale() {
    renderProductSection('flashSaleGrid', p => parseInt(p.discount) > 30, { limit: 30, isFlashSale: true });
}

function renderMerzyProducts() {
    renderProductSection('merzyProductsGrid', p => p.brand === 'Merzy', { limit: 30 });
}

window.updateBrandSection = function(brandName, element) {
    // 1. Cập nhật banner bên cạnh cho đúng thương hiệu
    const bannerImg = document.getElementById('brandBannerImg');
    if (bannerImg) {
        const bannerUrl = BRAND_BANNERS[brandName.toLowerCase()] || `https://picsum.photos/seed/${brandName.toLowerCase()}/400/800`;
        
        bannerImg.src = bannerUrl;
        bannerImg.alt = `${brandName} Banner`;
    }

    // 2. Render lại grid sản phẩm theo thương hiệu đã chọn
    renderProductSection('merzyProductsGrid', p => p.brand.toLowerCase() === brandName.toLowerCase(), { limit: 30 });
    
    // 3. Highlight tên thương hiệu được chọn
    if (element) {
        const siblings = element.parentElement.querySelectorAll('.brand-item');
        siblings.forEach(s => s.classList.remove('active'));
        element.classList.add('active');
    }

    showToast(`Đang hiển thị sản phẩm của ${brandName}`);
};

function renderMakeupProducts() {
    renderProductSection('makeupGrid', p => p.category.startsWith('trang-diem'));
}

function renderSunCareProducts() {
    renderProductSection('sunCareGrid', p => p.name.toLowerCase().includes('sun') || p.name.toLowerCase().includes('chống nắng'));
}

function renderMaskProducts() {
    renderProductSection('maskGrid', p => p.name.toLowerCase().includes('mask') || p.name.toLowerCase().includes('mặt nạ') || p.name.toLowerCase().includes('pad'));
}

function renderLocalBrandProducts() {
    renderProductSection('localBrandGrid', p => ['DrCeutics', 'Cocoon', 'CLINICOS', 'Emmié by HappySkin', 'B.O.M', 'La Roche-Posay', 'Anessa'].includes(p.brand));
}

function renderSkinCareSectionProducts() {
    renderProductSection('skinCareSectionGrid', p => p.category.includes('skincare') || p.category.includes('cham-soc-da'));
}

function renderBodyCareSectionProducts() {
    renderProductSection('bodyCareSectionGrid', p => p.category.includes('bodycare') || p.category.includes('body'));
}

function renderHairCareProducts() {
    renderProductSection('hairCareGrid', p => p.category.includes('haircare') || p.category.includes('cham-soc-toc'));
}

function renderMakeupSectionProducts() {
    renderProductSection('makeupSectionGrid', p => p.category.startsWith('trang-diem'));
}

function updateHomeSectionCounts() {
    // Các nhãn giờ đây đã được cập nhật tự động trong renderProductSection
    // Hàm này có thể giữ lại làm rỗng hoặc xóa nếu không gọi ở nơi khác
}

function createProductCard(p, isFlashSale = false) {
    const progress = Math.min(100, Math.floor((p.sold / 1000) * 100));
    return `
        <div class="product-card" onclick="goToDetail('${p._id || p.id}')">
            ${isFlashSale ? `<div class="badge-discount">-${p.discount}</div>` : ''}
            <div class="product-img-wrap">
                <img src="${p.image}" alt="${p.name}" referrerPolicy="no-referrer">
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${p._id || p.id}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                </button>
            </div>
            <p class="product-brand">${p.brand}</p>
            <h3 class="product-name">${p.name}</h3>
            <div class="product-price-wrap">
                <span class="price-current" style="color: #007bff;">${p.price.toLocaleString()}đ</span>
                ${isFlashSale ? `<span class="price-old">${p.oldPrice.toLocaleString()}đ</span>` : ''}
            </div>
            ${isFlashSale ? `
                <div class="flash-progress">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                    <div class="progress-text">Đã bán ${p.sold}</div>
                </div>
            ` : ''}
        </div>
    `;
}

window.goToDetail = function(id) {
    const p = products.find(item => (item._id || item.id).toString() === id.toString());
    if (p) {
        localStorage.setItem('selectedProductId', p._id || p.id);
        localStorage.setItem('selectedProductName', p.name);
        localStorage.setItem('selectedProductImage', p.image);
        localStorage.setItem('selectedProductData', JSON.stringify(p)); // Lưu toàn bộ data để detail page dùng ngay
        window.location.href = 'product-detail.html';
    }
};

// 5. CART LOGIC
window.addToCart = function(id, quantity) {
    // If quantity is not provided, check for qtyInput (for product detail page)
    if (quantity === undefined) {
        const qtyInput = document.getElementById('pdQty');
        quantity = qtyInput ? parseInt(qtyInput.value) : 1;
    }

    const product = products.find(p => (p._id || p.id).toString() === id.toString());
    if (!product) return;

    const existing = cart.find(item => (item._id || item.id).toString() === id.toString());

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }

    localStorage.setItem('qh_cart', JSON.stringify(cart));
    updateCartUI();
    showToast('Đã thêm sản phẩm vào giỏ hàng!');
    openCart();
};

window.buyNow = function(productId) {
    if (!isLoggedIn) {
        showToast('Vui lòng đăng nhập để mua hàng!');
        const loginModal = document.getElementById('loginModalOverlay');
        if (loginModal) loginModal.classList.add('active');
        return;
    }
    // Lấy danh sách sản phẩm từ biến toàn cục hoặc localStorage
    const allProds = products.length > 0 ? products : (JSON.parse(localStorage.getItem('selectedProductData')) ? [JSON.parse(localStorage.getItem('selectedProductData'))] : []);
    const product = allProds.find(p => (p._id || p.id).toString() === productId.toString());
    
    if (!product) return;
    
    let qty = 1;
    const qtyInput = document.getElementById('pdQty');
    if (qtyInput) qty = parseInt(qtyInput.value);
    
    currentCheckoutItems = [{ ...product, quantity: qty }];
    isDirectCheckout = true;
    
    // Gắn lại sự kiện cho form trước khi mở overlay (để chắc chắn preventDefault hoạt động)
    window.initCheckoutListeners();
    
    renderCheckoutSummary();
    
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    if (checkoutOverlay) { 
        checkoutOverlay.style.display = 'block';
        checkoutOverlay.classList.add('active');
        document.getElementById('checkoutForm').style.display = 'block';
    }
};

window.removeFromCart = function(id) {
    cart = cart.filter(item => (item._id || item.id).toString() !== id.toString());
    saveCart();
    updateCartUI();
};

/**
 * Thay đổi số lượng sản phẩm trong giỏ hàng (+/-)
 */
window.changeCartQty = function(id, delta) {
    const item = cart.find(i => (i._id || i.id).toString() === id.toString());
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            window.removeFromCart(id);
        } else {
            saveCart();
            updateCartUI();
        }
    }
};

function saveCart() {
    localStorage.setItem('qh_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const badge = document.getElementById('cartBadge');
    const itemsList = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');

    const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
    badge.innerText = totalQty;

    if (itemsList) {
        itemsList.innerHTML = cart.map(item => `
            <div class="cart-item" style="display:flex; gap:15px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:15px;">
                <img src="${item.image}" style="width:60px; height:60px; object-fit:contain; border-radius:4px;" referrerPolicy="no-referrer">
                <div style="flex:1;">
                    <p style="font-size:13px; font-weight:600; margin-bottom:5px;">${item.name}</p>
                    <p style="font-size:12px; color:#007bff; font-weight:800; margin-bottom: 8px;">${item.price.toLocaleString()}đ</p>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="qty-box" style="height:32px;">
                            <button style="width:30px; height:100%;" onclick="changeCartQty('${item._id || item.id}', -1)">-</button>
                            <input type="number" value="${item.quantity}" readonly style="width:35px; height:100%; font-size:12px; border-left:1px solid var(--border); border-right:1px solid var(--border);">
                            <button style="width:30px; height:100%;" onclick="changeCartQty('${item._id || item.id}', 1)">+</button>
                        </div>
                        <span style="font-size:11px; color:#999; cursor:pointer; text-decoration:underline;" onclick="removeFromCart('${item._id || item.id}')">Xóa</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (totalEl) totalEl.innerText = total.toLocaleString() + 'đ';
}

// 6. SLIDER
function startSlider() {
    const slides = document.querySelectorAll('.slide-item');
    if (slides.length === 0) return;
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

// 7. COUNTDOWN
function startCountdown() {
    const target = new Date().getTime() + (3 * 60 * 60 * 1000); // 3h from now
    
    setInterval(() => {
        const now = new Date().getTime();
        const diff = target - now;

        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        const hEl = document.getElementById('hours');
        const mEl = document.getElementById('mins');
        const sEl = document.getElementById('secs');

        if (hEl) hEl.innerText = h.toString().padStart(2, '0');
        if (mEl) mEl.innerText = m.toString().padStart(2, '0');
        if (sEl) sEl.innerText = s.toString().padStart(2, '0');
    }, 1000);
}

// 8. EVENTS
function initEvents() {
    // 1. Mobile Menu Toggle
    const mobBtn = document.getElementById('mobileMenuBtn');
    const sideMenu = document.querySelector('.side-menu');
    if (mobBtn && sideMenu) {
        mobBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = sideMenu.style.display === 'block';
            sideMenu.style.display = isVisible ? 'none' : 'block';
            sideMenu.style.position = 'fixed';
            sideMenu.style.top = '70px';
            sideMenu.style.left = '0';
            sideMenu.style.width = '250px';
            sideMenu.style.height = '100vh';
            sideMenu.style.boxShadow = '5px 0 15px rgba(0,0,0,0.1)';
        });
    }

    // Sticky Header Logic
    const stickyHeader = document.getElementById('stickyHeader');
    if (stickyHeader) {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                // Scrolling down (Swiping up) -> Hide
                stickyHeader.classList.add('header-hidden');
                stickyHeader.classList.remove('header-visible');
            } else {
                // Scrolling up (Pulling down) -> Show
                stickyHeader.classList.remove('header-hidden');
                stickyHeader.classList.add('header-visible');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }, false);
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput && searchResults) {
        const performSearch = () => {
            const q = searchInput.value.trim();
            if (q) {
                if (searchResults) searchResults.style.display = 'none';
                window.location.href = `category.html?q=${encodeURIComponent(q)}`;
            }
        };

        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                const q = searchInput.value.trim();
                if (!q) {
                    searchInput.focus();
                    searchInput.dispatchEvent(new Event('input'));
                } else {
                    performSearch();
                }
            });
        }

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const qNoAccent = removeAccents(q);
            
            if (q.length < 1) {
                searchResults.style.display = 'none';
                return;
            }

            const matches = products.filter(p => {
                const name = p.name.toLowerCase();
                const nameNoAccent = removeAccents(name);
                const brand = p.brand.toLowerCase();
                const brandNoAccent = removeAccents(brand);
                const category = p.category.toLowerCase();
                const categoryNoAccent = removeAccents(category);
                const details = (p.details || "").toLowerCase();
                const detailsNoAccent = removeAccents(details);
                
                // Check with accents
                if (name.includes(q) || brand.includes(q) || category.includes(q) || details.includes(q)) return true;
                
                // Check without accents
                if (nameNoAccent.includes(qNoAccent) || brandNoAccent.includes(qNoAccent) || categoryNoAccent.includes(qNoAccent) || detailsNoAccent.includes(qNoAccent)) return true;

                return false;
            }).slice(0, 10);

            if (matches.length > 0) {
                searchResults.innerHTML = matches.map(p => `
                    <div class="search-result-item" onclick="goToDetail('${p._id || p.id}')">
                        <img src="${p.image}" alt="${p.name}" referrerPolicy="no-referrer">
                        <div class="search-result-info">
                            <div class="search-result-name">${p.name}</div>
                            <div class="search-result-price">${p.price.toLocaleString()}đ</div>
                        </div>
                    </div>
                `).join('');
                searchResults.style.display = 'block';
            } else {
                searchResults.innerHTML = '<div style="padding: 15px; font-size: 13px; color: #999; text-align: center;">Không tìm thấy sản phẩm</div>';
                searchResults.style.display = 'block';
            }
        });

        // Hide search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // Cart Drawer
    const cartTrigger = document.getElementById('cartTrigger');
    const closeCartBtn = document.getElementById('closeCart');
    if (cartTrigger) cartTrigger.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

    // Login Modal
    const accountTrigger = document.getElementById('accountTrigger');
    const loginModal = document.getElementById('loginModalOverlay');
    const closeLogin = document.getElementById('closeLogin');
    const cartDrawer = document.getElementById('cartDrawer');

    const loginView = document.getElementById('loginView');
    const registerView = document.getElementById('registerView');
    const toRegister = document.getElementById('toRegister');
    const toLogin = document.getElementById('toLogin');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (accountTrigger) {
        accountTrigger.addEventListener('click', () => {
            if (isLoggedIn) {
                const profileOverlay = document.getElementById('profileOverlay');
                if (profileOverlay) {
                    profileOverlay.style.display = 'flex';
                    profileOverlay.classList.add('active');
                    // Reset to first tab
                    if (window.switchProfileTab) window.switchProfileTab('info');
                }
            } else {
                if (loginModal) {
                    // Reset to login view when opening
                    if (loginView) loginView.style.display = 'block';
                    if (registerView) registerView.style.display = 'none';
                    loginModal.classList.add('active');
                }
            }
        });
    }

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }

    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            if (loginModal) loginModal.classList.remove('active');
        });
    }

    if (toRegister) {
        toRegister.addEventListener('click', () => {
            if (loginView) loginView.style.display = 'none';
            if (registerView) registerView.style.display = 'block';
        });
    }

    if (toLogin) {
        toLogin.addEventListener('click', () => {
            if (loginView) loginView.style.display = 'block';
            if (registerView) registerView.style.display = 'none';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[type="text"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            
            try {
                // GỌI API ĐĂNG NHẬP THẬT TỪ BACKEND
                const data = await safeFetch(`${API_BASE_URL}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                handleAuthResponse(data, `Chào mừng ${data.name} đã trở lại!`);
            } catch (err) {
                showToast('Lỗi đăng nhập: ' + err.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            const rePassword = registerForm.querySelectorAll('input[type="password"]')[1].value;

            if (password !== rePassword) {
                showToast('Mật khẩu nhập lại không khớp!');
                return;
            }

            try {
                const data = await safeFetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                handleAuthResponse(data, 'Đăng ký thành công!');
            } catch (err) {
                showToast('Lỗi đăng ký: ' + err.message);
            }
        });
    }

    // PROFILE TAB LOGIC
    window.switchProfileTab = function(tabId) {
        // Update menu items
        const menuItems = document.querySelectorAll('.profile-menu-item');
        menuItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update tab panes
        const panes = document.querySelectorAll('.profile-tab-pane');
        panes.forEach(pane => {
            if (pane.id === 'tab-' + tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Special logic for orders
        if (tabId === 'orders') {
            renderProfileOrders();
        }
    };

    window.renderProfileOrders = async function(statusFilter = 'Chờ xác nhận') {
        const ordersList = document.getElementById('profileOrdersList');
        if (!ordersList) return;

        try {
            // Lấy đơn hàng thật từ Database thay vì localStorage
            const orders = await safeFetch(`${API_BASE_URL}/orders/myorders`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('qh_token')}` }
            });
            
            const filteredOrders = orders.filter(o => (o.status || 'Chờ xác nhận') === statusFilter);

            if (filteredOrders.length === 0) {
                ordersList.innerHTML = '<div style="color: #888; text-align: center; padding: 60px 20px;">' +
                                    '<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ddd" stroke-width="1.5" style="margin-bottom: 15px;"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>' +
                                    '<div style="font-size: 15px; font-weight: 500;">Bạn chưa có đơn hàng nào ở trạng thái này!</div>' +
                                    '</div>';
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';
            filteredOrders.forEach(order => {
                const statusColor = order.status === 'Đã huỷ' ? '#e74c3c' : (order.status === 'Đã giao' ? '#27ae60' : '#f39c12');
                html += `
                    <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px; background: #fff;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="font-weight: 700;">Đơn hàng #${order._id.substring(0,8)}</span>
                            <span style="color: ${statusColor}; font-weight: 700;">${order.status}</span>
                        </div>
                        ${order.items.map(item => `<div style="font-size: 13px;">${item.name} x${item.quantity}</div>`).join('')}
                <div style="text-align: right; margin-top: 10px; font-weight: 800; color: #007bff;">
                            Tổng: ${(order.totalPrice || 0).toLocaleString()}đ
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            ordersList.innerHTML = html;
        } catch (err) {
            ordersList.innerHTML = '<p style="text-align:center; padding: 20px;">Không thể tải đơn hàng.</p>';
        }
    };

    window.logoutUser = function() {
        isLoggedIn = false;
        currentUserName = '';
        localStorage.removeItem('qh_token');
        localStorage.removeItem('qh_userName');
        localStorage.removeItem('qh_userEmail');
        
        const display = document.getElementById('userNameDisplay');
        const adminBtn = document.getElementById('adminPanelBtn');
        const profileOverlay = document.getElementById('profileOverlay');
        
        if (display) display.style.display = 'none';
        if (adminBtn) adminBtn.style.display = 'none';

        const accountTrigger = document.getElementById('accountTrigger');
        if (accountTrigger) accountTrigger.style.color = 'inherit';

        if (profileOverlay) {
            profileOverlay.classList.remove('active');
            profileOverlay.style.display = 'none';
        }
        
        showToast('Đã đăng xuất thành công');
        location.reload(); // Reload to reset state
    };

    window.switchOrderTab = function(el, status) {
        document.querySelectorAll('.order-tab').forEach(tab => tab.classList.remove('active'));
        el.classList.add('active');
        renderProfileOrders(status);
    };

    // ADMIN REDIRECT
    const adminPanelBtn = document.getElementById('adminPanelBtn');
    if (adminPanelBtn) {
        adminPanelBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }

    // WEB CONFIG & THEME
    function applyWebConfig() {
        const hotline = localStorage.getItem('qh_hotline') || '1900 636 510';
        const email = localStorage.getItem('qh_email') || 'contact@qhskinlab.com';
        
        const hHeader = document.getElementById('headerHotline');
        const hFooter = document.getElementById('footerHotline');
        const eFooter = document.getElementById('footerEmail');

        if (hHeader) hHeader.textContent = `Hotline: ${hotline}`;
        if (hFooter) hFooter.textContent = hotline;
        if (eFooter) eFooter.textContent = email;
    }

    function applyTheme(theme) {
        document.body.className = '';
        if (theme !== 'default') {
            document.body.classList.add(theme);
        }
    }

    applyWebConfig();
    applyTheme(localStorage.getItem('qh_theme') || 'default');

    // CHECKOUT LOGIC
    const checkoutOverlay = document.getElementById('checkoutOverlay');
    const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutSummaryItems = document.getElementById('checkoutSummaryItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');

    const mainCheckoutBtn = document.getElementById('checkoutBtn');
    if (mainCheckoutBtn) {
        mainCheckoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Giỏ hàng của bạn đang trống!');
                return;
            }
            
            const hasMockProduct = cart.some(item => {
                const id = (item._id || item.id || "").toString();
                return false; // Cho phép thanh toán cả hàng mock để bạn test dễ dàng
            });

            if (hasMockProduct) {
                showToast('Giỏ hàng chứa sản phẩm mẫu. Vui lòng xóa và chọn sản phẩm từ hệ thống!');
                return;
            }

            currentCheckoutItems = [...cart];
            isDirectCheckout = false;
            closeCart();
            renderCheckoutSummary();
            checkoutOverlay.style.display = 'block';
            checkoutOverlay.classList.add('active');
            const successEl = document.getElementById('checkoutSuccess');
            const qrEl = document.getElementById('checkoutQR');
            if (successEl) successEl.style.display = 'none';
            if (qrEl) qrEl.style.display = 'none';
            if (checkoutForm) checkoutForm.style.display = 'block';
        });
    }

    // Đã đưa ra ngoài scope của initEvents để gọi được từ injectRequiredElements
    window.initCheckoutListeners = function() {
        const checkoutForm = document.getElementById('checkoutForm');
        const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
        const checkoutOverlay = document.getElementById('checkoutOverlay');

        if (closeCheckoutBtn && checkoutOverlay) {
            closeCheckoutBtn.onclick = () => {
                checkoutOverlay.classList.remove('active');
                checkoutOverlay.style.display = 'none';
            };
        }

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('orderName').value;
                const phone = document.getElementById('orderPhone').value;
                const email = document.getElementById('orderEmail').value;
                const address = document.getElementById('orderAddress').value;
                const note = document.getElementById('orderNote').value;
                const payment = document.getElementById('orderPaymentMethod').value;
                const total = currentCheckoutItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                const token = localStorage.getItem('qh_token');

                try {
                    const createdOrder = await safeFetch(`${API_BASE_URL}/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                            customerInfo: { name, phone, email, address, note },
                            items: currentCheckoutItems.map(i => ({
                                product: i._id || i.id,
                                name: i.name,
                                quantity: i.quantity,
                                price: i.price
                            })),
                            paymentMethod: payment,
                            totalPrice: total
                        })
                    });

                    const finalizeOrderUI = (order) => {
                        if (!isDirectCheckout) {
                            cart = [];
                            localStorage.setItem('qh_cart', JSON.stringify(cart));
                            updateCartUI();
                        }
                        
                        // Làm mới danh sách đơn hàng trong Profile ngay lập tức
                        if (isLoggedIn) {
                            renderProfileOrders();
                        }

                    const checkoutSuccess = document.getElementById('checkoutSuccess');
                    const checkoutQR = document.getElementById('checkoutQR');
                    if (checkoutSuccess) {
                        checkoutForm.style.display = 'none';
                        if (checkoutQR) checkoutQR.style.display = 'none';
                        checkoutSuccess.style.display = 'block';
                        
                        document.getElementById('successOrderId').textContent = '#' + order._id.substring(order._id.length - 8).toUpperCase();
                        document.getElementById('successOrderTotal').textContent = order.totalPrice.toLocaleString() + 'đ';
                        document.getElementById('successOrderItems').innerHTML = order.items.map(item => `
                            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px;">
                                <span>${item.name} x${item.quantity}</span>
                                <span>${(item.price * item.quantity).toLocaleString()}đ</span>
                            </div>
                        `).join('');
                    } else {
                        checkoutOverlay.classList.remove('active');
                        showToast('Đặt hàng thành công!');
                    }
                    };

                    if (payment === 'BANK') {
                        const realOrderCode = createdOrder._id.substring(createdOrder._id.length - 6).toUpperCase();
                        const checkoutQR = document.getElementById('checkoutQR');
                        const qrCodeImg = document.getElementById('qrCodeImg');
                        const qrAmount = document.getElementById('qrAmount');
                        const qrNote = document.getElementById('qrNote');
                        const confirmQRBtn = document.getElementById('confirmQRBtn');

                        if (checkoutQR) {
                            checkoutForm.style.display = 'none';
                            checkoutQR.style.display = 'block';
                            
                            if (qrAmount) qrAmount.textContent = createdOrder.totalPrice.toLocaleString() + 'đ';
                            if (qrNote) qrNote.textContent = 'QH' + realOrderCode;
                            if (qrCodeImg) {
                                qrCodeImg.src = `https://api.vietqr.io/image/vietcombank/0011004123456/qr_only.jpg?amount=${createdOrder.totalPrice}&addInfo=QH${realOrderCode}&accountName=NGUYEN THI THANH HIEN`;
                            }

                            confirmQRBtn.onclick = () => finalizeOrderUI(createdOrder);
                        } else {
                            finalizeOrderUI(createdOrder);
                        }
                    } else {
                        finalizeOrderUI(createdOrder);
                    }
                } catch (err) {
                    showToast('Lỗi: ' + err.message);
                }
            });
        }
    }

    // Call init on DOMContentLoaded to ensure elements exist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCheckoutListeners);
    } else {
        initCheckoutListeners();
    }


    // Back to Top
    const btt = document.getElementById('backToTop');
    if (btt) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) btt.classList.add('active');
            else btt.classList.remove('active');
        });
        btt.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    window.onclick = (e) => {
        if (loginModal && e.target === loginModal) loginModal.classList.remove('active');
        if (cartDrawer && e.target === cartDrawer) cartDrawer.classList.remove('active');
        if (checkoutOverlay && e.target === checkoutOverlay) checkoutOverlay.classList.remove('active');
        const profileOverlay = document.getElementById('profileOverlay');
        if (profileOverlay && e.target === profileOverlay) {
            profileOverlay.classList.remove('active');
            profileOverlay.style.display = 'none';
        }
    };

    const adminBtn = document.getElementById('adminPanelBtn');
    if (adminBtn) {
        adminBtn.onclick = () => window.location.href = 'admin.html';
    }

    // Kích hoạt nút Mua ngay trên trang chi tiết sản phẩm
    const buyNowBtn = document.querySelector('.btn-buy-now');
    if (buyNowBtn) {
        buyNowBtn.onclick = () => {
            const productId = localStorage.getItem('selectedProductId');
            if (productId) window.buyNow(productId);
        };
    }

    // Gắn sự kiện cho nút Thanh toán trong giỏ hàng
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!isLoggedIn) {
                showToast('Vui lòng đăng nhập để thực hiện thanh toán!');
                const loginModal = document.getElementById('loginModalOverlay');
                if (loginModal) loginModal.classList.add('active');
                return;
            }
            if (cart.length === 0) {
                showToast('Giỏ hàng của bạn đang trống!');
                return;
            }
            currentCheckoutItems = [...cart];
            isDirectCheckout = false;
            closeCart();
            renderCheckoutSummary();
            const checkoutOverlay = document.getElementById('checkoutOverlay');
            if (checkoutOverlay) {
                checkoutOverlay.style.display = 'block';
                checkoutOverlay.classList.add('active');
                document.getElementById('checkoutForm').style.display = 'block';
                document.getElementById('checkoutSuccess').style.display = 'none';
                document.getElementById('checkoutQR').style.display = 'none';
            }
        });
    }
}

// --- GLOBAL CHECKOUT LISTENERS ---
window.initCheckoutListeners = function() {
    const checkoutForm = document.getElementById('checkoutForm');
    const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
    const checkoutOverlay = document.getElementById('checkoutOverlay');

    if (closeCheckoutBtn && checkoutOverlay) {
        closeCheckoutBtn.onclick = (e) => {
            e.preventDefault();
            checkoutOverlay.classList.remove('active');
            checkoutOverlay.style.display = 'none';
        };
    }

    if (checkoutForm) {
        // Sử dụng addEventListener và remove cũ để tránh trùng lặp hoặc mất sự kiện
        const handleCheckoutSubmit = async (e) => {
            e.preventDefault(); // QUAN TRỌNG: Ngăn trang web load lại

            const name = document.getElementById('orderName').value;
            const phone = document.getElementById('orderPhone').value;
            const email = document.getElementById('orderEmail').value;
            const address = document.getElementById('orderAddress').value;
            const note = document.getElementById('orderNote').value;
            const payment = document.getElementById('orderPaymentMethod').value;
            const total = currentCheckoutItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            const token = localStorage.getItem('qh_token');

            try {
                const createdOrder = await safeFetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        customerInfo: { name, phone, email, address, note },
                        items: currentCheckoutItems.map(i => ({
                            product: i._id || i.id,
                            name: i.name,
                            quantity: i.quantity,
                            price: i.price
                        })),
                        paymentMethod: payment,
                        totalPrice: total
                    })
                });

                const finalizeOrderUI = (order) => {
                    if (!isDirectCheckout) {
                        cart = [];
                        localStorage.setItem('qh_cart', JSON.stringify(cart));
                        updateCartUI();
                    }

                    const successView = document.getElementById('checkoutSuccess');
                    const qrView = document.getElementById('checkoutQR');
                    const formView = document.getElementById('checkoutForm');
                    
                    if (successView) {
                        if (formView) formView.style.display = 'none';
                        if (qrView) qrView.style.display = 'none';
                        successView.style.display = 'block';
                        
                        const successId = document.getElementById('successOrderId');
                        const successTotal = document.getElementById('successOrderTotal');
                        const successItems = document.getElementById('successOrderItems');
                        
                        if (successId) successId.textContent = '#' + order._id.substring(order._id.length - 8).toUpperCase();
                        if (successTotal) successTotal.textContent = order.totalPrice.toLocaleString() + 'đ';
                        if (successItems) {
                            successItems.innerHTML = order.items.map(item => `
                                <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px;">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>${(item.price * item.quantity).toLocaleString()}đ</span>
                                </div>
                            `).join('');
                        }
                    } else {
                        checkoutOverlay.classList.remove('active');
                        showToast('Đặt hàng thành công!');
                    }
                };

                if (payment === 'BANK') {
                    const realOrderCode = createdOrder._id.substring(createdOrder._id.length - 6).toUpperCase();
                    const qrView = document.getElementById('checkoutQR');
                    const qrCodeImg = document.getElementById('qrCodeImg');
                    const qrAmount = document.getElementById('qrAmount');
                    const qrNote = document.getElementById('qrNote');
                    const confirmBtn = document.getElementById('confirmQRBtn');

                    if (qrView) {
                        checkoutForm.style.display = 'none';
                        qrView.style.display = 'block';
                        if (qrAmount) qrAmount.textContent = createdOrder.totalPrice.toLocaleString() + 'đ';
                        if (qrNote) qrNote.textContent = 'QH' + realOrderCode;
                        if (qrCodeImg) {
                            qrCodeImg.src = `https://api.vietqr.io/image/vietcombank/0011004123456/qr_only.jpg?amount=${createdOrder.totalPrice}&addInfo=QH${realOrderCode}&accountName=NGUYEN THI THANH HIEN`;
                        }
                        confirmBtn.onclick = () => finalizeOrderUI(createdOrder);
                        
                        const cancelQRBtn = document.getElementById('cancelQRBtn');
                        if (cancelQRBtn) {
                            cancelQRBtn.onclick = () => {
                                qrView.style.display = 'none';
                                checkoutForm.style.display = 'block';
                            };
                        }
                    } else { finalizeOrderUI(createdOrder); }
                } else { finalizeOrderUI(createdOrder); }
            } catch (err) { showToast('Lỗi: ' + err.message); }
        };
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
};

/**
 * Hàm xử lý dữ liệu sau khi đăng nhập hoặc đăng ký thành công
 */
function handleAuthResponse(data, successMsg) {
    // Lưu token và thông tin vào localStorage
    localStorage.setItem('qh_token', data.token);
    localStorage.setItem('qh_userName', data.name);
    localStorage.setItem('qh_userEmail', data.email);
    
    // Cập nhật trạng thái ứng dụng
    isLoggedIn = true;
    currentUserName = data.name;
    
    updateUserDisplay(data.name);
    showToast(successMsg);
    
    const loginModal = document.getElementById('loginModalOverlay');
    if (loginModal) loginModal.classList.remove('active');
}

function renderCheckoutSummary() {
    const checkoutSummaryItems = document.getElementById('checkoutSummaryItems');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');

    if (!checkoutSummaryItems) return;
    
    checkoutSummaryItems.innerHTML = currentCheckoutItems.map(item => `
        <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
            <div style="width: 60px; height: 60px; border: 1px solid #eee; border-radius: 4px; overflow: hidden; flex-shrink: 0;">
                <img src="${item.image}" style="width: 100%; height: 100%; object-fit: cover;" referrerPolicy="no-referrer">
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 14px; color: #333; margin-bottom: 4px; line-height: 1.4;">${item.name}</div>
                <div style="font-size: 13px; color: #666;">Số lượng: ${item.quantity}</div>
            </div>
            <div style="font-weight: 800; font-size: 15px; color: #007bff;">${(item.price * item.quantity).toLocaleString()}đ</div>
        </div>
    `).join('');

    const total = currentCheckoutItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (checkoutSubtotal) checkoutSubtotal.textContent = total.toLocaleString() + 'đ';
    if (checkoutTotal) checkoutTotal.textContent = total.toLocaleString() + 'đ';
}

// --- BỔ SUNG CÁC TÍNH NĂNG CÒN THIẾU ---

// 1. Theo dõi sản phẩm đã xem
window.trackProductView = function(productId) {
    let viewed = JSON.parse(localStorage.getItem('qh_viewed')) || [];
    // Loại bỏ nếu đã tồn tại và đưa lên đầu
    viewed = viewed.filter(id => id !== productId);
    viewed.unshift(productId);
    // Chỉ giữ lại 10 sản phẩm gần nhất
    localStorage.setItem('qh_viewed', JSON.stringify(viewed.slice(0, 10)));
};

// 2. Gợi ý sản phẩm liên quan
window.renderRelatedProducts = function(currentProduct) {
    const grid = document.getElementById('relatedProductsGrid');
    if (!grid) return;

    const related = products
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);

    if (related.length > 0) {
        grid.innerHTML = related.map(p => createProductCard(p)).join('');
    } else {
        grid.innerHTML = '<p style="grid-column: span 4; text-align: center; color: #999;">Không có sản phẩm liên quan.</p>';
    }
};

// 3. Hiển thị đánh giá (Mock data)
window.renderReviews = function(productId) {
    const container = document.querySelector('.reviews-list');
    if (!container) return;

    // Giả lập dữ liệu đánh giá
    const mockReviews = [
        { user: "Nguyễn An", rating: 5, date: "10/04/2026", content: "Sản phẩm dùng rất thích, đóng gói cẩn thận." },
        { user: "Trần Bình", rating: 4, date: "08/04/2026", content: "Giao hàng hơi chậm một chút nhưng chất lượng ok." }
    ];

    container.innerHTML = mockReviews.map(r => `
        <div class="review-item">
            <div class="review-header">
                <div class="user-info">
                    <span class="username">${r.user}</span>
                    <span class="review-date">${r.date}</span>
                </div>
                <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            <p class="review-text">${r.content}</p>
            <div class="shop-response">
                <div class="shop-name">Q&H SKINLAB phản hồi:</div>
                <p class="shop-text">Cảm ơn bạn đã tin tưởng ủng hộ shop ạ!</p>
            </div>
        </div>
    `).join('');
};

// 4. Cung cấp hàm getProducts cho các trang con
window.getProducts = function() {
    return products;
};

// 5. Tính năng Yêu thích (Wishlist)
window.toggleFavorite = function(id) {
    let favorites = JSON.parse(localStorage.getItem('qh_favorites')) || [];
    if (favorites.includes(id)) {
        favorites = favorites.filter(fid => fid !== id);
        showToast('Đã xóa khỏi danh sách yêu thích');
    } else {
        favorites.push(id);
        showToast('Đã thêm vào danh sách yêu thích');
    }
    localStorage.setItem('qh_favorites', JSON.stringify(favorites));
};

function updateUserDisplay(name) {
    if (!name) return;
    
    // Đảm bảo các biến trạng thái được cập nhật
    isLoggedIn = true;
    currentUserName = name;

    // Giải mã JWT Payload để kiểm tra quyền hiển thị nút Admin trên UI
    const token = localStorage.getItem('qh_token');
    const base64DecodeUnicode = (str) => decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    
    let isAdmin = false;
    if (token) {
        try {
            const payload = JSON.parse(base64DecodeUnicode(token.split('.')[1]));
            isAdmin = payload.isAdmin === true || payload.admin === true;
        } catch (e) { isAdmin = false; }
    }

    const display = document.getElementById('userNameDisplay');
    const adminBtn = document.getElementById('adminPanelBtn');

    isLoggedIn = true;
    currentUserName = name;
    
    if (display) {
        // Ẩn bảng tên/thông tin để giữ lại logo icon duy nhất theo yêu cầu
        display.style.display = 'none';
    }

    // Hiển thị nút Admin nếu là tài khoản admin thật sự
    if (isAdmin && adminBtn) {
        adminBtn.style.display = 'flex';
    }

    // Thay đổi màu icon tài khoản để biết đã đăng nhập
    const accountTrigger = document.getElementById('accountTrigger');
    if (accountTrigger) {
        accountTrigger.style.color = 'var(--primary)';
    }

    // Update Profile Overlay Info
    const profileUserName = document.getElementById('profileUserName');
    const profileUserEmail = document.getElementById('profileUserEmail');
    const actualEmail = localStorage.getItem('qh_userEmail') || (name.toLowerCase().replace(/\s/g, '') + '@gmail.com');
    const profileAvatar = document.getElementById('profileAvatar');
    const infoName = document.getElementById('infoName');
    const infoEmail = document.getElementById('infoEmail');

    if (profileUserName) profileUserName.textContent = name;
    if (profileUserEmail) profileUserEmail.textContent = actualEmail;
    if (infoName) infoName.textContent = name;
    if (infoEmail) infoEmail.textContent = actualEmail;
    if (profileAvatar) {
        profileAvatar.textContent = name.substring(0, 2).toUpperCase();
    }
}

function openCart() { 
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.add('active'); 
}
function closeCart() { 
    const drawer = document.getElementById('cartDrawer');
    if (drawer) drawer.classList.remove('active'); 
}

function showToast(msg) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- MULTI-PAGE COMPATIBILITY: INJECT MODALS ---
function injectRequiredElements() {
    // Kiểm tra và thêm Login Modal nếu chưa có
    if (!document.getElementById('loginModalOverlay')) {
        const modalHtml = `
            <div class="modal-overlay" id="loginModalOverlay">
                <div class="login-modal">
                    <span class="close-modal" id="closeLogin">&times;</span>
                    <div id="loginView">
                        <h2>Đăng nhập</h2>
                        <form class="login-form" id="loginForm">
                            <input type="text" id="loginUsername" placeholder="Email hoặc Tên đăng nhập" required>
                            <input type="password" id="loginPassword" placeholder="Mật khẩu" required>
                            <button type="submit" class="btn-login">Đăng nhập</button>
                            <div class="register-section">
                                <p>Chưa có tài khoản?</p>
                                <button type="button" class="btn-register" id="toRegisterBtn">Đăng ký ngay</button>
                            </div>
                        </form>
                    </div>
                    <div id="registerView" style="display: none;">
                        <h2>Đăng ký</h2>
                        <form class="login-form" id="registerForm">
                            <input type="text" id="regName" placeholder="Họ và tên" required>
                            <input type="email" id="regEmail" placeholder="Email" required>
                            <input type="password" id="regPassword" placeholder="Mật khẩu" required>
                            <button type="submit" class="btn-login">Đăng ký</button>
                            <div class="register-section">
                                <p>Đã có tài khoản?</p>
                                <button type="button" class="btn-register" id="toLoginBtn">Đăng nhập</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Gắn sự kiện cho modal
        const closeLogin = document.getElementById('closeLogin');
        const toRegisterBtn = document.getElementById('toRegisterBtn');
        const toLoginBtn = document.getElementById('toLoginBtn');
        const loginView = document.getElementById('loginView');
        const registerView = document.getElementById('registerView');
        const loginModal = document.getElementById('loginModalOverlay');
        
        if (closeLogin) {
            closeLogin.onclick = () => loginModal.classList.remove('active');
        }
        if (toRegisterBtn) {
            toRegisterBtn.onclick = () => {
                loginView.style.display = 'none';
                registerView.style.display = 'block';
            };
        }
        if (toLoginBtn) {
            toLoginBtn.onclick = () => {
                loginView.style.display = 'block';
                registerView.style.display = 'none';
            };
        }
        if (loginModal) {
            loginModal.onclick = (e) => {
                if (e.target === loginModal) loginModal.classList.remove('active');
            };
        }
    }
    
    // Kiểm tra và thêm Profile Overlay nếu chưa có
    if (!document.getElementById('profileOverlay')) {
        const profileHtml = `
            <div class="admin-overlay" id="profileOverlay" style="z-index: 12000; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center;">
                <div style="width: 1000px; height: 600px; background: white; border-radius: 8px; display: flex; overflow: hidden; position: relative;">
                    <button onclick="document.getElementById('profileOverlay').style.display='none';" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    <div style="width: 250px; background: #fafafa; border-right: 1px solid #eee; padding: 30px 0;">
                        <div style="padding: 0 25px 30px; border-bottom: 1px solid #eee; text-align: center;">
                            <div id="profileAvatar" style="width: 50px; height: 50px; background: var(--red); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-weight: 700;">NH</div>
                            <div id="profileUserName" style="font-weight: 700;">User</div>
                            <div id="profileUserEmail" style="font-size: 12px; color: #888;">user@email.com</div>
                        </div>
                        <div class="profile-menu-item active" data-tab="info" onclick="switchProfileTab('info')" style="padding: 12px 25px; cursor: pointer;">Thông tin</div>
                        <div class="profile-menu-item" data-tab="orders" onclick="switchProfileTab('orders')" style="padding: 12px 25px; cursor: pointer;">Đơn hàng</div>
                        <div class="profile-menu-item logout" onclick="logoutUser()" style="padding: 12px 25px; cursor: pointer; margin-top: 20px;">Đăng xuất</div>
                    </div>
                    <div style="flex: 1; padding: 40px; overflow-y: auto;">
                        <div id="tab-info" class="profile-tab-pane active">
                            <h3>Thông tin cá nhân</h3>
                            <p id="infoName">Chưa cập nhật</p>
                            <p id="infoEmail">Chưa cập nhật</p>
                        </div>
                        <div id="tab-orders" class="profile-tab-pane" style="display: none;">
                            <h3>Đơn hàng của bạn</h3>
                            <div id="profileOrdersList">Chưa có đơn hàng</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', profileHtml);
    }

    // Kiểm tra và thêm Checkout Overlay nếu chưa có (Để nút Mua ngay ở trang chi tiết hoạt động)
    if (!document.getElementById('checkoutOverlay')) {
        const checkoutHtml = `
            <div class="admin-overlay" id="checkoutOverlay" style="z-index: 11000; background: #f4f4f4; display:none;">
                <div style="background: white; padding: 15px 5%; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; position: sticky; top: 0; z-index: 100;">
                    <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0; cursor: pointer;" onclick="const o = document.getElementById('checkoutOverlay'); o.classList.remove('active'); o.style.display='none';">Q&H SKINLAB</h1>
                    <button id="closeCheckoutBtn" style="background: none; border: none; cursor: pointer; font-size: 24px;" onclick="const o = document.getElementById('checkoutOverlay'); o.classList.remove('active'); o.style.display='none';">&times;</button>
                </div>
                <div class="container" style="max-width: 1100px; margin: 40px auto; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px;">
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                        <h2 style="margin-bottom: 20px;">Thông tin giao hàng</h2>
                        <form id="checkoutForm">
                            <div style="margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:700;">Họ và tên</label>
                                <input type="text" id="orderName" required style="width:100%; padding:10px; border:1px solid #eee;">
                            </div>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                                <div>
                                    <label style="display:block; margin-bottom:5px; font-weight:700;">Số điện thoại</label>
                                    <input type="tel" id="orderPhone" required style="width:100%; padding:10px; border:1px solid #eee;">
                                </div>
                                <div>
                                    <label style="display:block; margin-bottom:5px; font-weight:700;">Email</label>
                                    <input type="email" id="orderEmail" required style="width:100%; padding:10px; border:1px solid #eee;">
                                </div>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:700;">Địa chỉ</label>
                                <textarea id="orderAddress" required style="width:100%; padding:10px; border:1px solid #eee;"></textarea>
                            </div>
                            <div style="margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:700;">Thanh toán</label>
                                <select id="orderPaymentMethod" style="width:100%; padding:10px; border:1px solid #eee;">
                                    <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                                    <option value="BANK">Chuyển khoản ngân hàng</option>
                                </select>
                            </div>
                            <textarea id="orderNote" placeholder="Ghi chú (tùy chọn)" style="width:100%; padding:10px; border:1px solid #eee; margin-bottom:20px;"></textarea>
                            <button type="submit" style="width:100%; padding:15px; background:#5dade2; color:white; border:none; font-weight:800; cursor:pointer; text-transform:uppercase;">HOÀN TẤT ĐẶT HÀNG</button>
                        </form>
                        <div id="checkoutQR" style="display:none; text-align:center; padding: 20px 0;">
                            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 20px; color: #333;">THANH TOÁN CHUYỂN KHOẢN</h2>
                            <p style="color: #666; margin-bottom: 20px; font-size: 14px;">Vui lòng quét mã QR bên dưới để thanh toán đơn hàng.</p>
                            
                            <div style="background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: inline-block; margin-bottom: 20px;">
                                <img id="qrCodeImg" src="" alt="QR Code" style="width: 250px; height: 250px; object-fit: contain; margin-bottom: 15px;">
                                <div style="text-align: left; font-size: 14px; line-height: 1.6;">
                                    <p><strong>Chủ tài khoản:</strong> Nguyễn Thị Thanh Hiền</p>
                                    <p><strong>Số tài khoản:</strong> 1234567890</p>
                                    <p><strong>Ngân hàng:</strong> Vietcombank</p>
                                    <p><strong>Số tiền:</strong> <span id="qrAmount" style="color: #007bff; font-weight: 800;">0đ</span></p>
                                    <p><strong>Nội dung:</strong> <span id="qrNote" style="color: var(--primary); font-weight: 700;">QH123456</span></p>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 15px; justify-content: center;">
                                <button id="confirmQRBtn" style="padding: 12px 25px; background: var(--primary); color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">XÁC NHẬN ĐÃ CHUYỂN</button>
                            </div>
                        </div>
                        <div id="checkoutSuccess" style="display:none; text-align:center; padding:20px;">
                            <h2 style="color:var(--primary);">ĐẶT HÀNG THÀNH CÔNG!</h2>
                            <p>Mã đơn hàng: <strong id="successOrderId"></strong></p>
                            <p>Số tiền thanh toán: <strong id="successOrderTotal" style="color: #007bff;">0đ</strong></p>
                            <div id="successOrderItems" style="margin-top:15px; text-align:left; border-top:1px solid #eee; padding-top:10px;"></div>
                            <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; cursor:pointer;">TIẾP TỤC MUA SẮM</button>
                        </div>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); height:fit-content;">
                        <h2 style="margin-bottom: 20px;">Đơn hàng của bạn</h2>
                        <div id="checkoutSummaryItems"></div>
                        <div style="border-top:1px solid #eee; padding-top:15px; margin-top:15px;">
                            <div class="flex-between" style="font-weight:800; color:#007bff; font-size:20px;">
                                <span>TỔNG CỘNG:</span>
                                <span id="checkoutTotal">0đ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', checkoutHtml);
    }
    
    // Kiểm tra và thêm Toast Container nếu chưa có
    if (!document.getElementById('toastContainer')) {
        const toastHtml = `<div id="toastContainer" class="toast-container"></div>`;
        document.body.insertAdjacentHTML('beforeend', toastHtml);
    }
}

// --- ADMIN: EXPORT PRODUCTS JSON FOR PERSISTENCE ---
window.exportProductsJSON = function() {
    const productsData = JSON.stringify(products, null, 4);
    const blob = new Blob([productsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also show in a prompt for easy copying
    console.log("EXPORTED PRODUCTS JSON:");
    console.log(productsData);
    alert("Dữ liệu sản phẩm đã được tải xuống (products_data.json). Hãy mở file này, copy nội dung và dán vào biến PRODUCTS_EXTENDED trong script.js để sản phẩm mới luôn hiện trên Vercel!");
};

