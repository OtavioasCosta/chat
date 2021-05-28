const app = require('http').createServer(resposta); 
const fs = require('fs');
const io = require('socket.io')(app);
const usuarios = []; 
const ultimas_mensagens = []; 
app.listen(8080);

console.log("Aplicação está em execução...");

function resposta (req, res) {
	let arquivo = "";
	if(req.url == "/"){
		arquivo = __dirname + '/index.html';
	}else{
		arquivo = __dirname + req.url;
	}
	fs.readFile(arquivo,
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

	socket.on("entrar", function(apelido, callback){
		if(!(apelido in usuarios)){
			socket.apelido = apelido;
			usuarios[apelido] = socket;
		
			for(indice in ultimas_mensagens){
				socket.emit("atualizar mensagens", ultimas_mensagens[indice]);
			}


			const mensagem = pegarDataAtual() + " —  @" + apelido + " acabou de entrar na sala";
			const obj_mensagem = {msg: mensagem, tipo: 'sistema'};

			io.sockets.emit("atualizar usuarios", Object.keys(usuarios)); 
			io.sockets.emit("atualizar mensagens", obj_mensagem); 
			armazenaMensagem(obj_mensagem); 

			callback(true);
		}else{
			callback(false);
		}
	});


	socket.on("enviar mensagem", function(dados, callback){

		let mensagem_enviada = dados.msg;
		let usuario = dados.usu;
		if(usuario == null)
			usuario = '';

		mensagem_enviada =  pegarDataAtual() + " — @" + socket.apelido + ": " + mensagem_enviada;
		const obj_mensagem = {msg: mensagem_enviada, tipo: ''};

		if(usuario == ''){
			io.sockets.emit("atualizar mensagens", obj_mensagem);
			armazenaMensagem(obj_mensagem); 
		}else{
			obj_mensagem.tipo = 'privada';
			socket.emit("atualizar mensagens", obj_mensagem);
			usuarios[usuario].emit("atualizar mensagens", obj_mensagem); 
		}
		
		callback();
	});

	socket.on("disconnect", function(){
		delete usuarios[socket.apelido];
		const mensagem = pegarDataAtual() + " —  @" + socket.apelido + " saiu da sala";
		const obj_mensagem = {msg: mensagem, tipo: 'sistema'};


		
		io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
		io.sockets.emit("atualizar mensagens", obj_mensagem);

		armazenaMensagem(obj_mensagem);
	});

});



function pegarDataAtual(){
	const dataAtual = new Date();
	const dia = (dataAtual.getDate()<10 ? '0' : '') + dataAtual.getDate();
	const mes = ((dataAtual.getMonth() + 1)<10 ? '0' : '') + (dataAtual.getMonth() + 1);
	const ano = dataAtual.getFullYear();
	const hora = (dataAtual.getHours()<10 ? '0' : '') + dataAtual.getHours();
	const minuto = (dataAtual.getMinutes()<10 ? '0' : '') + dataAtual.getMinutes();
	const segundo = (dataAtual.getSeconds()<10 ? '0' : '') + dataAtual.getSeconds();

	const dataFormatada = dia + "-" + mes + "-" + ano + " " + hora + ":" + minuto + ":" + segundo;
	return dataFormatada;
}


function armazenaMensagem(mensagem){
	if(ultimas_mensagens.length > 5){
		ultimas_mensagens.shift();
	}

	ultimas_mensagens.push(mensagem);
}