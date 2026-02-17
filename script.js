function toggleMenu() {
    const nav = document.querySelector('nav');
    nav.classList.toggle('active');
}

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dotsContainer = document.querySelector('.slider-dots');

function initSlider() {
    if (slides.length === 0) return;

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
    let next = (currentSlide + 1) % slides.length;
    goToSlide(next);
}

let slideInterval;

function startAutoSlide() {
    slideInterval = setInterval(nextSlide, 3000);
}

function resetAutoSlide() {
    clearInterval(slideInterval);
    startAutoSlide();
}

const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    initSlider();

    const animatedElements = document.querySelectorAll('.fade-up');
    animatedElements.forEach(el => observer.observe(el));

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const feedback = document.getElementById('formFeedback');
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;

            // Get reCAPTCHA token
            const recaptchaResponse = grecaptcha.getResponse();

            if (!recaptchaResponse) {
                feedback.style.color = 'red';
                feedback.textContent = 'Lütfen robot olmadığınızı doğrulayın.';
                return;
            }

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        message,
                        recaptchaToken: recaptchaResponse
                    })
                });

                const result = await response.json();

                if (result.success) {
                    feedback.style.color = 'green';
                    feedback.textContent = result.message;
                    contactForm.reset();
                    grecaptcha.reset(); // Reset captcha after success
                } else {
                    feedback.style.color = 'red';
                    feedback.textContent = result.message;
                }
            } catch (error) {
                feedback.style.color = 'red';
                feedback.textContent = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
            }
        });
    }
});
