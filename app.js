const app = require('http').createServer(response); 
const fs = require('fs');
const io = require('socket.io')(app);
const users = []; 
const latest_posts = []; 
app.listen(8080);

console.log("Aplicação está em execução...");

function response (req, res) {
	let file = "";
	if(req.url == "/"){
		file = __dirname + '/index.html';
	}else{
		file = __dirname + req.url;
	}
	fs.readFile(file,
		function (err, data) {
			if (err) {
				res.writeHead(404);
				return res.end('Página ou arquivo não encontrados');
			}

			res.writeHead(200);
			res.end(data);
		}
	);
}

io.on("connection", function(socket){

	socket.on("entrar", function(nickname, callback){
		if(!(nickname in users)){
			socket.nickname = nickname;
			users[nickname] = socket;
		
			for(index in latest_posts){
				socket.emit("atualizar mensagens", latest_posts[index]);
			}


			const message = getCurrentDate() + " —  @" + nickname + " acabou de entrar na sala";
			const obj_message = {msg: message, type: 'sistema'};

			io.sockets.emit("atualizar usuarios", Object.keys(users)); 
			io.sockets.emit("atualizar mensagens", obj_message); 
			storeMessage(obj_message); 

			callback(true);
		}else{
			callback(false);
		}
	});


	socket.on("enviar mensagem", function(data, callback){

		let message_sent = data.msg;
		let user = data.usu;
		if(user == null)
		user = '';

			message_sent =  getCurrentDate() + " — @" + socket.nickname + ": " + message_sent;
		const obj_message = {msg: message_sent, type: ''};

		if(user == ''){
			io.sockets.emit("atualizar mensagens", obj_message);
			storeMessage(obj_message); 
		}else{
			obj_message.type = 'privada';
			socket.emit("atualizar mensagens", obj_message);
			users[user].emit("atualizar mensagens", obj_message); 
		}
		
		callback();
	});

	socket.on("disconnect", function(){
		delete users[socket.nickname];
		const message = getCurrentDate() + " —  @" + socket.nickname + " saiu da sala";
		const obj_message = {msg: message, type: 'sistema'};

		io.sockets.emit("atualizar usuarios", Object.keys(users));
		io.sockets.emit("atualizar mensagens", obj_message);

		storeMessage(obj_message);
	});

});



function getCurrentDate(){
	const currentDate = new Date();
	const day = (currentDate.getDate()<10 ? '0' : '') + currentDate.getDate();
	const month	= ((currentDate.getMonth() + 1)<10 ? '0' : '') + (currentDate.getMonth() + 1);
	const year = currentDate.getFullYear();
	const hour = (currentDate.getHours()<10 ? '0' : '') + currentDate.getHours();
	const minute = (currentDate.getMinutes()<10 ? '0' : '') + currentDate.getMinutes();
	const second = (currentDate.getSeconds()<10 ? '0' : '') + currentDate.getSeconds();

	const formattedDate = day + "-" + month	+ "-" + year + " " + hour + ":" + minute + ":" + second;
	return formattedDate;
}


function storeMessage(message){
	if(latest_posts.length > 5){
		latest_posts.shift();
	}

	latest_posts.push(message);
}