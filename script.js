function toggleMenu() {
    const nav = document.getElementById('mainNav') || document.querySelector('nav');
    if (nav) nav.classList.toggle('active');
}

function closeMenu() {
    const nav = document.getElementById('mainNav') || document.querySelector('nav');
    if (nav) nav.classList.remove('active');
}

// Dışarı tıklayınca menüyü kapat
document.addEventListener('click', function(e) {
    const nav = document.getElementById('mainNav') || document.querySelector('nav');
    const icon = document.querySelector('.mobile-menu-icon');
    if (nav && icon && !nav.contains(e.target) && !icon.contains(e.target)) {
        nav.classList.remove('active');
    }
});

// Slider
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.querySelector('.slider-dots');

function initSlider() {
    if (slides.length === 0 || !dotsContainer) return;

    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    startAutoSlide();
}

function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    document.querySelectorAll('.dot')[currentSlide].classList.remove('active');
    currentSlide = n;
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.dot')[currentSlide].classList.add('active');
    resetAutoSlide();
}

function nextSlide() {
    goToSlide((currentSlide + 1) % slides.length);
}

let slideInterval;
function startAutoSlide() { slideInterval = setInterval(nextSlide, 4000); }
function resetAutoSlide() { clearInterval(slideInterval); startAutoSlide(); }

// Fade-up animasyonu
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { root: null, rootMargin: '0px', threshold: 0.12 });

document.addEventListener('DOMContentLoaded', () => {
    initSlider();

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // İletişim formu
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const feedback = document.getElementById('formFeedback');
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const message = document.getElementById('message').value.trim();

            if (!name || !email || !phone || !message) {
                feedback.style.color = 'red';
                feedback.textContent = 'Lütfen tüm alanları doldurun.';
                return;
            }

            let recaptchaResponse = '';
            if (typeof grecaptcha !== 'undefined') {
                recaptchaResponse = grecaptcha.getResponse();
                if (!recaptchaResponse) {
                    feedback.style.color = 'red';
                    feedback.textContent = 'Lütfen robot olmadığınızı doğrulayın.';
                    return;
                }
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Gönderiliyor...';
            feedback.textContent = '';

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, message, recaptchaToken: recaptchaResponse })
                });

                const result = await response.json();

                if (result.success) {
                    feedback.style.color = 'green';
                    feedback.textContent = result.message;
                    contactForm.reset();
                    if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
                } else {
                    feedback.style.color = 'red';
                    feedback.textContent = result.message;
                }
            } catch (error) {
                feedback.style.color = 'red';
                feedback.textContent = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Gönder';
            }
        });
    }
});
