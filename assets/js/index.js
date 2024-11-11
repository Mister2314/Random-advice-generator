document.querySelector(".button").addEventListener("click", () => {
    fetch("https://api.adviceslip.com/advice")
        .then(response => {
            if (!response.ok) {
                throw new Error("its error");
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            const advice = data.slip.advice;
            const adviceId = data.slip.id;
            document.querySelector(".advice").innerText = advice;
            document.querySelector(".adviceId").innerText = `Advice #${adviceId}`;
        })
        .catch(error => {
            console.error(error);
        })
});
