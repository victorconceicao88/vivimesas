export const menu = {
  churrasco: {
    nome: "Churrasco",
    categoria: "cozinha",
    itens: [
      {
        id: 101,
        nome: "Churrasco Misto",
        descricao: "Escolha suas carnes preferidas",
        preco: 12.00,
        opcoes: {
          feijao: {
            titulo: "Tipo de Feijao",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "caldo", label: "Feijao Caldo" },
              { valor: "tropeiro", label: "Feijao Tropeiro" }
            ],
            padrao: "caldo"
          },
          acompanhamentos: {
            titulo: "Acompanhamentos (Escolha 1)",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "banana", label: "Banana" },
              { valor: "batata Frita", label: "Batata Frita" },
              { valor: "mandiocaFrita", label: "Mandioca Frita" },
              { valor: "mandiocaCozida", label: "Mandioca Cozida" }
            ],
            padrao: "banana"
          },
          carnes: {
            titulo: "Selecione as Carnes (Max. 2)",
            descricao: "Selecione ate 2 tipos de carne",
            obrigatorio: true,
            tipo: "checkbox",
            maximo: 2,
            minimo: 1,
            itens: [
              { valor: "coracao", label: "Coracao" },
              { valor: "costelinha de Porco ", label: "Costelina de Porco" },
              { valor: "file", label: "File" },
              { valor: "linguica", label: "Linguica" },
              { valor: "maminha", label: "Maminha" },
              { valor: "torresmo", label: "Torresmo" },
              { 
                valor: "somenteMaminha", 
                label: "Apenas Maminha (+1 euro)", 
                preco: 1.00, 
                exclusivo: true,
                descricao: "Serve apenas maminha como carne"
              }
            ],
            regras: [
              {
                condicao: { valor: "somenteMaminha", selecionado: true },
                acao: "desmarcarOutros"
              }
            ]
          },
          salada: {
            titulo: "Salada",
            obrigatorio: false,
            tipo: "radio",
            itens: [
              { valor: "mista", label: "Salada Mista" },
              { valor: "vinagrete", label: "Vinagrete" },
              { valor: "semSalada", label: "Sem Salada", padrao: true }
            ]
          },
          pontoCarne: {
            titulo: "Ponto da Carne",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "malpassada", label: "Mal passada" },
              { valor: "aoponto", label: "Ao ponto", padrao: true },
              { valor: "bempassada", label: "Bem passada" }
            ]
          }
        },
        observacoes: {
          maxLength: 120
        }
      },
      {
        id: 102,
        nome: "Maminha",
        descricao: "Corte nobre de picanha suina",
        preco: 13.00,
        opcoes: {
          feijao: {
            titulo: "Tipo de Feijao",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "caldo", label: "Feijao Caldo" },
              { valor: "tropeiro", label: "Feijao Tropeiro" }
            ]
          },
          acompanhamentos: {
            titulo: "Acompanhamentos",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "banana", label: "Banana" },
              { valor: "batata", label: "Batata" },
              { valor: "mandiocaFrita", label: "Mandioca Frita" },
              { valor: "mandiocaCozida", label: "Mandioca Cozida" }
            ]
          },
          salada: {
            titulo: "Salada",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "mista", label: "Salada Mista" },
              { valor: "vinagrete", label: "Vinagrete" },
              { valor: "semSalada", label: "Sem Salada" }
            ]
          }
        }
      },
      {
        id: 103,
        nome: "Linguica Toscana",
        descricao: "Linguica suina tradicional",
        preco: 12.00,
        opcoes: {
          feijao: {
            titulo: "Tipo de Feijao",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "caldo", label: "Feijao Caldo" },
              { valor: "tropeiro", label: "Feijao Tropeiro" }
            ]
          },
          acompanhamentos: {
            titulo: "Acompanhamentos",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "banana", label: "Banana" },
              { valor: "batata", label: "Batata" },
              { valor: "mandiocaFrita", label: "Mandioca Frita" },
              { valor: "mandiocaCozida", label: "Mandioca Cozida" }
            ]
          },
          salada: {
            titulo: "Salada",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "mista", label: "Salada Mista" },
              { valor: "vinagrete", label: "Vinagrete" },
              { valor: "semSalada", label: "Sem Salada" }
            ]
          }
        }
      },
      {
        id: 104,
        nome: "Costelinha de Porco",
        descricao: "Costela suina assada",
        preco: 12.00,
        opcoes: {
          feijao: {
            titulo: "Tipo de Feijao",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "caldo", label: "Feijao Caldo" },
              { valor: "tropeiro", label: "Feijao Tropeiro" }
            ]
          },
          acompanhamentos: {
            titulo: "Acompanhamentos",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "banana", label: "Banana" },
              { valor: "batata", label: "Batata" },
              { valor: "mandiocaFrita", label: "Mandioca Frita" },
              { valor: "mandiocaCozida", label: "Mandioca Cozida" }
            ]
          },
          salada: {
            titulo: "Salada",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "mista", label: "Salada Mista" },
              { valor: "vinagrete", label: "Vinagrete" },
              { valor: "semSalada", label: "Sem Salada" }
            ]
          }
        }
      },
      {
        id: 105,
        nome: "Peito de Frango Grelhado",
        descricao: "Frango temperado na churrasqueira",
        preco: 12.00,
        opcoes: {
          feijao: {
            titulo: "Tipo de Feijao",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "caldo", label: "Feijao Caldo" },
              { valor: "tropeiro", label: "Feijao Tropeiro" }
            ]
          },
          acompanhamentos: {
            titulo: "Acompanhamentos",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "banana", label: "Banana" },
              { valor: "batata", label: "Batata" },
              { valor: "mandiocaFrita", label: "Mandioca Frita" },
              { valor: "mandiocaCozida", label: "Mandioca Cozida" }
            ]
          },
          salada: {
            titulo: "Salada",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "mista", label: "Salada Mista" },
              { valor: "vinagrete", label: "Vinagrete" },
              { valor: "semSalada", label: "Sem Salada" }
            ]
          }
        }
      },
      {
        id: 106,
        nome: "Fogao",
        descricao: "Prato completo de churrasco",
        preco: 15.90
      },
      {
        id: 107,
        nome: "Fogao Kids",
        descricao: "Versao infantil do prato Fogao",
        preco: 8.00
      }
    ]
  },
  hamburgueres: {
    nome: "Hamburgueres",
    categoria: "cozinha",
    itens: [
      {
        id: 201,
        nome: "X-Salada",
        descricao: "Pao, hamburguer, queijo, alface, tomate e maionese",
        preco: 6.50,
        opcoes: {
          extras: {
            titulo: "Adicionais",
            obrigatorio: false,
            tipo: "checkbox",
            itens: [
              { valor: "bacon", label: "Bacon" },
              { valor: "queijoExtra", label: "Queijo Extra" },
              { valor: "ovo", label: "Ovo" }
            ]
          }
        }
      },
      {
        id: 202,
        nome: "X-Bacon",
        descricao: "Pao, hamburguer, queijo, bacon, alface e tomate",
        preco: 8.00,
        opcoes: {
          extras: {
            titulo: "Adicionais",
            obrigatorio: false,
            tipo: "checkbox",
            itens: [
              { valor: "queijoExtra", label: "Queijo Extra" },
              { valor: "ovo", label: "Ovo" }
            ]
          }
        }
      },
      {
        id: 203,
        nome: "X-Frango",
        descricao: "Pao, hamburguer de frango, queijo, alface e tomate",
        preco: 8.00,
        opcoes: {
          extras: {
            titulo: "Adicionais",
            obrigatorio: false,
            tipo: "checkbox",
            itens: [
              { valor: "bacon", label: "Bacon" },
              { valor: "queijoExtra", label: "Queijo Extra" }
            ]
          }
        }
      },
      {
        id: 204,
        nome: "X-Especial",
        descricao: "Pao, hamburguer, queijo, presunto, ovo, alface e tomate",
        preco: 7.00,
        opcoes: {
          extras: {
            titulo: "Adicionais",
            obrigatorio: false,
            tipo: "checkbox",
            itens: [
              { valor: "bacon", label: "Bacon" }
            ]
          }
        }
      },
      {
        id: 205,
        nome: "X-Tudo",
        descricao: "Pao, hamburguer, queijo, presunto, bacon, ovo, alface, tomate e batata palha",
        preco: 9.00,
        opcoes: {
          extras: {
            titulo: "Adicionais",
            obrigatorio: false,
            tipo: "checkbox",
            itens: [
              { valor: "queijoExtra", label: "Queijo Extra" }
            ]
          }
        }
      }
    ]
  },
  combos: {
    nome: "Combos",
    categoria: "cozinha",
    itens: [
      {
        id: 301,
        nome: "Combo Frango Supreme",
        descricao: "Sanduiche de frango com batata frita e bebida",
        preco: 10.00,
        opcoes: {
          bebidas: {
            titulo: "Bebida",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "refrigerante", label: "Refrigerante" },
              { valor: "suco", label: "Suco Natural" }
            ]
          }
        }
      },
      {
        id: 302,
        nome: "Combo X-Tudo",
        descricao: "Sanduiche completo com batata frita e bebida",
        preco: 12.00,
        opcoes: {
          bebidas: {
            titulo: "Bebida",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "refrigerante", label: "Refrigerante" },
              { valor: "suco", label: "Suco Natural" }
            ]
          }
        }
      }
    ]
  },
  porcoes: {
    nome: "Porcoes",
    categoria: "cozinha",
    itens: [
      {
        id: 401,
        nome: "Porcao de Arroz",
        descricao: "Arroz bianco soltinho",
        preco: 3.00
      },
      {
        id: 402,
        nome: "Queijo Coalho",
        descricao: "Queijo coalho grelhado",
        preco: 6.00
      },
      {
        id: 403,
        nome: "Torresmo",
        descricao: "Torresmo crocante",
        preco: 6.00
      },
      {
        id: 404,
        nome: "Porcao de Mandioca",
        descricao: "Mandioca frita crocante",
        preco: 6.00
      },
      {
        id: 405,
        nome: "Porcao de Batata Frita",
        descricao: "Batata frita crocante",
        preco: 3.00
      },
      {
        id: 406,
        nome: "Porcao de Carnes",
        descricao: "Selecione suas carnes preferidas",
        preco: 10.00,
        opcoes: {
          carnes: {
            titulo: "Carnes",
            obrigatorio: true,
            tipo: "checkbox",
            maximo: 2,
            itens: [
              { valor: "coracao", label: "Coracao" },
              { valor: "costela", label: "Costela" },
              { valor: "file", label: "File" },
              { valor: "linguica", label: "Linguica" },
              { valor: "maminha", label: "Maminha" },
              { valor: "torresmo", label: "Torresmo" }
            ]
          }
        }
      }
    ]
  },
  aguas: {
    nome: "Aguas",
    categoria: "bar",
    itens: [
      {
        id: 501,
        nome: "Agua Sem Gas",
        descricao: "Garrafa 500ml",
        preco: 1.00
      },
      {
        id: 502,
        nome: "Agua Com Gas",
        descricao: "Garrafa 500ml",
        preco: 1.50
      }
    ]
  },
  cafes: {
    nome: "Cafes",
    categoria: "bar",
    itens: [
      {
        id: 503,
        nome: "Cafe",
        descricao: "Cafe expresso",
        preco: 1.00
      },
      {
        id: 504,
        nome: "Cafe Galao",
        descricao: "Cafe com leite em copo alto",
        preco: 1.50
      }
    ]
  },
  refrigerantes: {
    nome: "Refrigerantes",
    categoria: "bar",
    itens: [
      {
        id: 505,
        nome: "Refrigerante",
        descricao: "Lata 330ml",
        preco: 2.00,
        opcoes: {
          sabores: {
            titulo: "Sabores",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "coca", label: "Coca-Cola" },
              { valor: "pepsi", label: "Pepsi" },
              { valor: "fanta", label: "Fanta" },
              { valor: "sprite", label: "Sprite" }
            ]
          }
        }
      }
    ]
  },
  cervejas: {
    nome: "Cervejas",
    categoria: "bar",
    itens: [
      {
        id: 506,
        nome: "Imperial",
        descricao: "Cerveja Imperial",
        preco: 2.00
      },
      {
        id: 507,
        nome: "Sagres",
        descricao: "Cerveja Sagres",
        preco: 2.00
      },
      {
        id: 508,
        nome: "Super Bock",
        descricao: "Cerveja Super Bock",
        preco: 2.00
      },
      {
        id: 522,
        nome: "Summersby",
        descricao: "Summersby",
        preco: 5.00
      },
      {
        id: 527,
        nome: "Caneca",
        descricao: "Caneca de cerveja",
        preco: 3.50
      },
      {
        id: 528,
        nome: "Pannache",
        descricao: "Mistura de cerveja e refrigerante",
        preco: 4.00
      }
    ]
  },
  vinhos: {
    nome: "Vinhos",
    categoria: "bar",
    itens: [
      {
        id: 509,
        nome: "Vinho da Casa",
        descricao: "Vinho tinto ou branco",
        preco: 10.00,
        opcoes: {
          tipo: {
            titulo: "Tipo",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "tinto", label: "Tinto" },
              { valor: "branco", label: "Branco" }
            ]
          }
        }
      },
      {
        id: 510,
        nome: "Esporao Monitis",
        descricao: "Vinho Esporao Monitis",
        preco: 15.00
      },
      {
        id: 511,
        nome: "Grao Vasco",
        descricao: "Vinho Grao Vasco",
        preco: 12.00
      },
      {
        id: 512,
        nome: "Papa Figos",
        descricao: "Vinho Papa Figos",
        preco: 15.00
      },
      {
        id: 513,
        nome: "Sossego",
        descricao: "Vinho Sossego",
        preco: 15.00
      },
      {
        id: 514,
        nome: "Taca de Vinho",
        descricao: "Taca de vinho da casa",
        preco: 3.00
      },
      {
        id: 515,
        nome: "Jarra de Vinho",
        descricao: "Jarra de vinho da casa",
        preco: 10.00
      },
      {
        id: 516,
        nome: "Meia Jarra de Vinho",
        descricao: "Meia jarra de vinho da casa",
        preco: 6.00
      }
    ]
  },
  licores: {
    nome: "Licores",
    categoria: "bar",
    itens: [
      {
        id: 517,
        nome: "Cachaca",
        descricao: "Dose de cachaca",
        preco: 1.50
      },
      {
        id: 526,
        nome: "Constantino",
        descricao: "Sumo Constantino",
        preco: 2.00
      }
    ]
  },
  cocktails: {
    nome: "Coqueteis",
    categoria: "bar",
    itens: [
      {
        id: 518,
        nome: "Caipirinha",
        descricao: "Caipirinha tradicional",
        preco: 6.00
      },
      {
        id: 519,
        nome: "Sangria",
        descricao: "Sangria de vinho",
        preco: 15.00
      },
      {
        id: 520,
        nome: "Sangria 0,5L",
        descricao: "Meia jarra de sangria",
        preco: 8.00
      },
      {
        id: 521,
        nome: "Sangria Taca",
        descricao: "Taca de sangria",
        preco: 5.00
      }
    ]
  },
  sumos: {
    nome: "Sumos",
    categoria: "bar",
    itens: [
      {
        id: 523,
        nome: "Sumos Naturais",
        descricao: "Sumo natural de fruta",
        preco: 3.00,
        opcoes: {
          sabores: {
            titulo: "Sabores",
            obrigatorio: true,
            tipo: "radio",
            itens: [
              { valor: "laranja", label: "Laranja" },
              { valor: "ananas", label: "Ananas" },
              { valor: "maracuja", label: "Maracuja" }
            ]
          }
        }
      },
      {
        id: 524,
        nome: "Compal",
        descricao: "Sumo Compal",
        preco: 2.00
      },
      {
        id: 525,
        nome: "Ice Tea",
        descricao: "Ice Tea",
        preco: 2.00
      }
    ]
  },
  sobremesas: {
    nome: "Sobremesas",
    categoria: "cozinha",
    itens: [
      {
        id: 601,
        nome: "Acai Pequeno",
        descricao: "300ml com acompanhamentos",
        preco: 6.00,
        opcoes: {
          acompanhamentos: {
            titulo: "Acompanhamentos",
            obrigatorio: true,
            tipo: "checkbox",
            itens: [
              { valor: "granola", label: "Granola" },
              { valor: "leiteCondensado", label: "Leite Condensado" },
              { valor: "banana", label: "Banana" },
              { valor: "morango", label: "Morango" }
            ]
          }
        }
      },
      {
        id: 602,
        nome: "Acai Grande",
        descricao: "500ml com acompanhamentos",
        preco: 10.00,
        opcoes: {
          acompanhamentos: {
            titulo: "Acompanhamentos",
            obrigatorio: true,
            tipo: "checkbox",
            itens: [
              { valor: "granola", label: "Granola" },
              { valor: "leiteCondensado", label: "Leite Condensado" },
              { valor: "banana", label: "Banana" },
              { valor: "morango", label: "Morango" }
            ]
          }
        }
      },
      {
        id: 603,
        nome: "Pudim Caseiro",
        descricao: "Fatia de pudim tradicional",
        preco: 3.00
      }
    ]
  },
  pratosSemana: {
    nome: "Pratos da Semana",
    categoria: "cozinha",
    itens: [
      {
        id: 701,
        nome: "Vaca Atolada (Quinta-feira)",
        descricao: "Prato tradicional com carne e mandioca",
        preco: 13.00,
        disponivel: ["quinta"]
      },
      {
        id: 702,
        nome: "Feijoada (Sabado e Domingo)",
        descricao: "Feijoada completa com todos os acompanhamentos",
        preco: 13.00,
        disponivel: ["sabado", "domingo"]
      }
    ]
  }
};