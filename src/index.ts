import { AppDataSource } from "./data-source"
import { User } from "./entity/User"
import TelegramBot from "node-telegram-bot-api";
import express from 'express';
import { Signup } from "./entity/Signup";
import dayjs from "dayjs";
import cron from 'node-cron';
import { IsNull } from "typeorm";

AppDataSource.initialize().then(async () => {

    const bot = new TelegramBot('7463901808:AAG0Lo7eTiMPE5d8P6yJXxiwybub9ImTp5M', {
        polling: true
    });

    const app = express();
    const signupRepo = AppDataSource.getRepository(Signup);
    const userRepo = AppDataSource.getRepository(User);

    app.get('/signup/:id', async (req, res) => {
        const signup = new Signup();
        signup.id = req.params.id;
        await signupRepo.save(signup);
        await bot.sendMessage(-1002235534796, `новый пользователь айди ванвин ${signup.id}`);
    });

    app.get('/redirect/:id', async (req, res) => {
        const user = await userRepo.findOneBy({
            id: req.params.id
        });

        if (user) {
            user.cameWithLink = true;
            await userRepo.save(user);
            await bot.sendPhoto(+user.id, 'https://ibb.co/4FRk86m', {
                caption: '✅После прохождения регистрации\nВведите ID (только цифры):'
            });
        }

        res.redirect('https://1wcght.life/casino/list?open=register&p=yhe9');
    });
    app.get('/firstdeposit/:id', async (req, res) => {
        const user = await userRepo.findOneBy({
            oneWinId: req.params.id
        });
        if (!user) return res.status(200).end();
        user.deposited = true;
        await userRepo.save(user);
    });

    bot.onText(/\/start/, async (msg) => {
        let user = await userRepo.findOneBy({
            id: String(msg.from.id)
        });
        if (!user) {
            user = new User();
            user.id = String(msg.from.id);
            user.username = msg.from.username;
            await userRepo.save(user);
        }


        bot.sendPhoto(msg.from.id, 'https://ibb.co/DY8hqLG', {
            caption: 'ℹ️ Выбери тариф, для доступа в мою приватную группу с сигналами.\n\n📲Повторюсь, я готов дать тебе бесплатный доступ на 3 дня, чтобы ты убедился в том, что этот бот работает и на нем можно зарабатывать в десятки раз больше, чем стоимость подписки!',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '80.000 рублей (доступ навсегда)',
                            callback_data: 'pay'
                        }
                    ],
                    [
                        {
                            text: '25.000 рублей (доступ на 30 дней)',
                            callback_data: 'pay'
                        }
                    ],
                    [
                        {
                            text: '3 дня бесплатно',
                            callback_data: 'free'
                        }
                    ]
                ]
            }
        });
    });
    bot.onText(/./, async (msg) => {
        if (!msg.text.startsWith('/')) {
            const user = await userRepo.findOneBy({
                id: String(msg.from.id)
            });

            if (!user) {
                await bot.sendMessage(msg.from.id, 'Пожалуйста, пройдите регистрацию через /start');
                return;
            }

            const id = msg.text;

            const signup = await signupRepo.findOneBy({
                id
            });

            if (!signup) {
                await bot.sendMessage(msg.from.id, 'Бот не нашел регистрацию по вашему ID. Если это не так, отправьте его еще раз (отправьте только айди)');
                return;
            }
            user.oneWinId = signup.id;
            user.endDate = dayjs().add(3, 'days').toDate();
            await userRepo.save(user);
            await bot.sendPhoto(msg.from.id, 'https://ibb.co/4FRk86m',{
                caption: `✅Поздравляю! Вам открыты все возможности бота на 3 дня🤖\n\n Дата сброса: ${user.endDate.toUTCString()}\n🚀Чтобы получить сигнал, нажми соответствующую кнопку ниже:`,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'получить сигнал',
                                callback_data: 'signal'
                            }
                        ]
                    ]
                }
            })
            
        }
    })

    

    bot.on('callback_query', async (q) => {
        if (q.data === 'free') {
            bot.sendPhoto(q.from.id, 'https://ibb.co/C76kh7X', {
                caption: '📲Для начала необходимо провести регистрацию на 1win (провайдер игры LuckyJet). Чтобы бот успешно проверил регистрацию, нужно соблюсти важные условия:\n\n 1️⃣Аккаунт обязательно должен быть НОВЫМ! Если у вас уже есть аккаунт и при нажатии на кнопку «РЕГИСТРАЦИЯ» вы попадаете на старый, необходимо выйти с него и заново нажать на кнопку «РЕГИСТРАЦИЯ», после чего по новой зарегистрироваться! \n\n2️⃣Чтобы бот смог проверить вашу регистрацию, обязательно нужно ввести промокод "FLAMEPART" при регистрации!\n После регистрации напишите боту ваш ID.',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Регистрация',
                                url: `http://194.0.194.46:5143/redirect/${q.from.id}`
                            }
                        ],
                    ]
                }
            });
        } else if (q.data == 'pay') {
            bot.sendMessage(q.from.id, '😕На данный момент число платных пользователей 30/30\n попробуйте приобрести подписку через 24 часа')
        } else if (q.data === 'signal') {
            const user = await userRepo.findOneBy({
                id: String(q.from.id),
            });
            
            if (!user) {
                await bot.sendMessage(q.from.id, 'Пожалуйста, пройдите регистрацию через /start');
                return;
            }

            if (user.endDate < new Date()) {
                await bot.sendMessage(q.from.id, 'К сожалению, доступ к боту закрыт');
                return;
            }

            if (!user.deposited) {
                await bot.sendPhoto(q.from.id, 'https://ibb.co/4FRk86m', {
                    caption: 'Сначала необходимо пополнить баланс.',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '💲Пополнить',
                                    url: 'https://1wcght.life/casino/list?open=register&p=yhe9'
                                },
                                {
                                    text: '🔍Я пополнил',
                                    callback_data: 'check'
                                }
                            ],
                            [
                                {
                                    text: '⬅️Назад',
                                    callback_data: 'open'
                                }
                            ]
                        ]
                    }
                });
                return;
            }
            
            const random = Math.random() * 7 + 1;
            const str = random.toFixed(2);

            await bot.sendMessage(q.from.id, `Текущий коэффициент: ${str}`);
 
       } else if (q.data === 'check') {
        const user = await userRepo.findOneBy({
            id: String(q.from.id),
        });
        
        if (!user) {
            await bot.sendMessage(q.from.id, 'Пожалуйста, пройдите регистрацию через /start');
            return;
        }
        await bot.sendMessage(q.from.id, '⚠️Проверяю депозит...');
        if (!user.deposited) {
            await bot.sendMessage(q.from.id, '❗Вы не пополнили депозит, сначала необходимо пополнить баланс!', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '💲Пополнить',
                                url: 'https://1wcght.life/casino/list?open=register&p=yhe9'
                            },
                            {
                                text: '🔍Я пополнил',
                                callback_data: 'check'
                            }
                        ],
                        [
                            {
                                text: '⬅️Назад',
                                callback_data: 'open'
                            }
                        ]
                    ]
                }
            });
        } else {
            await bot.sendMessage(+user.id, 'Баланс пополнен', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: 'Получить сигнал',
                                callback_data: 'signal'
                            }
                        ],
                        [
                            {
                                text: '🎲Меню',
                                callback_data: 'menu'
                            }
                        ]
                    ]
                }
            });
        }
       } else if (q.data === 'menu') {
        bot.sendPhoto(q.from.id, 'https://ibb.co/DY8hqLG', {
            caption: 'ℹ️ Выбери тариф, для доступа в мою приватную группу с сигналами.\n\n📲Повторюсь, я готов дать тебе бесплатный доступ на 3 дня, чтобы ты убедился в том, что этот бот работает и на нем можно зарабатывать в десятки раз больше, чем стоимость подписки!',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '80.000 рублей (доступ навсегда)',
                            callback_data: 'pay'
                        }
                    ],
                    [
                        {
                            text: '25.000 рублей (доступ на 30 дней)',
                            callback_data: 'pay'
                        }
                    ],
                    [
                        {
                            text: '3 дня бесплатно',
                            callback_data: 'free'
                        }
                    ]
                ]
            }
        });
       } else if (q.data === 'open') {
        await bot.sendPhoto(q   .from.id, 'https://ibb.co/4FRk86m',{
            caption: `✅Поздравляю! Вам открыты все возможности бота на 3 дня🤖\n\n Последнее обновление: ${(new Date()).toUTCString()}\n🚀Чтобы получить сигнал, нажми соответствующую кнопку ниже:`,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'получить сигнал',
                            callback_data: 'signal'
                        }
                    ],
                    [
                        {
                            text: '🎲Меню',
                            callback_data: 'menu'
                        }
                    ]
                ]
            }
        })
       }
    });

    cron.schedule("0 17 * * *", async () => {
        const users = await userRepo.find({
            where: {
                oneWinId: IsNull()
            }
        });
        for (const u of users) {
            await bot.sendMediaGroup(+u.id, [
                {
                    type: 'photo',
                    media: 'https://ibb.co/bJJ4xNr',
                    caption: 'Мне ЕЖЕДНЕВНО пишут пользователи бота о крупных заносах с наших сигналов. Не упуская данную возможность и регистрируйся по ссылке😎\n\nРЕГИСТРАЦИЯ на 1win (https://1wcght.life/casino/list?open=register&p=yhe9)\n\nПромокод: FLAMEPART +500% К ДЕПОЗИТУ (вывод без верификаций)'
                },
                {
                    type: 'photo',
                    media: 'https://ibb.co/yFDdSGQ'
                },
                {
                    type: 'photo',
                    media: 'https://ibb.co/Ky4X3By'
                },
                {
                    type: 'photo',
                    media: 'https://ibb.co/bdhQr2p'
                },
                {
                    type: 'photo',
                    media: 'https://ibb.co/54GWpf8',
                },
            ]);
        }
    })
    app.listen(5143);
}).catch(error => console.log(error))
